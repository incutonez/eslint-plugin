import { ASTUtils, ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

export default ESLintUtils.RuleCreator.withoutDocs({
	defaultOptions: [],
	meta: {
		type: "layout",

		docs: {
			description: "Enforce linebreaks after opening and before closing array brackets",
		},

		fixable: "whitespace",

		schema: [
			{
				oneOf: [
					{
						type: "string",
						enum: ["always", "never", "consistent"],
					},
					{
						type: "object",
						properties: {
							multiline: {
								type: "boolean",
							},
							minItems: {
								type: ["integer", "null"],
								minimum: 0,
							},
							bracesSameLine: {
								type: "boolean"
							},
						},
						additionalProperties: false,
					},
				],
			},
		],

		messages: {
			unexpectedOpeningLinebreak: "There should be no linebreak after '['.",
			unexpectedClosingLinebreak: "There should be no linebreak before ']'.",
			missingOpeningLinebreak: "A linebreak is required after '['.",
			missingClosingLinebreak: "A linebreak is required before ']'.",
		},
	},

	create(context) {
		const sourceCode = context.sourceCode;

		/**
		 * Normalizes a given option value.
		 * @param option An option value to parse.
		 * @returns Normalized option object.
		 */
		function normalizeOptionValue(option: any) {
			let consistent = false;
			let bracesSameLine = false;
			let multiline = false;
			let minItems = 0;

			if (option) {
				if (option === "consistent") {
					consistent = true;
					minItems = Number.POSITIVE_INFINITY;
				}
				else if (option.bracesSameLine) {
					bracesSameLine = true;
					minItems = option.minItems || Number.POSITIVE_INFINITY;
				}
				else if (option === "always" || (typeof option !== "string" && option.minItems === 0)) {
					minItems = 0;
				}
				else if (option === "never") {
					minItems = Number.POSITIVE_INFINITY;
				}
				else {
					multiline = Boolean(option.multiline);
					minItems = option.minItems || Number.POSITIVE_INFINITY;
				}
			}
			else {
				consistent = false;
				multiline = true;
				minItems = Number.POSITIVE_INFINITY;
			}

			return {
				consistent,
				multiline,
				minItems,
				bracesSameLine,
			};
		}

		/**
		 * Normalizes a given option value.
		 * @param options An option value to parse.
		 * @returns Normalized option object.
		 */
		function normalizeOptions(options: any) {
			const value = normalizeOptionValue(options);

			return {
				ArrayExpression: value,
				ArrayPattern: value,
			};
		}

		/**
		 * Reports that there shouldn't be a linebreak after the first token
		 */
		function reportNoBeginningLinebreak(node: TSESTree.Node, token: TSESTree.Token) {
			context.report({
				node,
				loc: token.loc,
				messageId: "unexpectedOpeningLinebreak",
				fix(fixer) {
					const nextToken = sourceCode.getTokenAfter(token, {
						includeComments: true,
					});

					if (!nextToken || ASTUtils.isCommentToken(nextToken)) {
						return null;
					}

					return fixer.removeRange([token.range[1], nextToken.range![0]]);
				},
			});
		}

		/**
		 * Reports that there shouldn't be a linebreak before the last token
		 * @param node The node to report in the event of an error.
		 * @param token The token to use for the report.
		 */
		function reportNoEndingLinebreak(node: TSESTree.Node, token: TSESTree.Token, previousToken?: TSESTree.Token) {
			context.report({
				node,
				loc: token.loc,
				messageId: "unexpectedClosingLinebreak",
				fix(fixer) {
					previousToken ??= sourceCode.getTokenBefore(token, {
						includeComments: true,
					})!;

					if (!previousToken || ASTUtils.isCommentToken(previousToken)) {
						return null;
					}

					return fixer.removeRange([previousToken.range![1], token.range[0]]);
				},
			});
		}

		/**
		 * Reports that there should be a linebreak after the first token
		 * @param node The node to report in the event of an error.
		 * @param token The token to use for the report.
		 */
		function reportRequiredBeginningLinebreak(node: TSESTree.Node, token: TSESTree.Token) {
			context.report({
				node,
				loc: token.loc,
				messageId: "missingOpeningLinebreak",
				fix(fixer) {
					return fixer.insertTextAfter(token, "\n");
				},
			});
		}

		/**
		 * Reports that there should be a linebreak before the last token
		 * @param node The node to report in the event of an error.
		 * @param token The token to use for the report.
		 */
		function reportRequiredEndingLinebreak(node: TSESTree.Node, token: TSESTree.Token) {
			context.report({
				node,
				loc: token.loc,
				messageId: "missingClosingLinebreak",
				fix(fixer) {
					return fixer.insertTextBefore(token, "\n");
				},
			});
		}

		/**
		 * Reports a given node if it violated this rule.
		 * @param node A node to check. This is an ArrayExpression node or an ArrayPattern node.
		 */
		function check(node: TSESTree.Node) {
			// @ts-expect-error type cast
			const elements = node.elements;
			// @ts-expect-error type cast
			const normalizedOptions = normalizeOptions(context.options[0]);
			// @ts-expect-error type cast
			const options = normalizedOptions[node.type];
			const openBracket = sourceCode.getFirstToken(node)!;
			const closeBracket = sourceCode.getLastToken(node)!;
			const firstIncComment = sourceCode.getTokenAfter(openBracket, {
				includeComments: true,
			})!;
			const lastIncComment = sourceCode.getTokenBefore(closeBracket, {
				includeComments: true,
			})!;
			const maybeOpenBrace = sourceCode.getTokenAfter(openBracket)!;
			let maybeCloseBrace = sourceCode.getTokenBefore(closeBracket)!;
			const maybeCommentBefore = sourceCode.getTokenBefore(maybeOpenBrace, {
				includeComments: true
			})!;
			const needsLinebreaks = (
				elements.length >= options.minItems
				|| (
					options.multiline
					&& elements.length > 0
					&& firstIncComment.loc!.start.line !== lastIncComment.loc!.end.line
				)
				|| (
					elements.length === 0
					&& firstIncComment.type === "Block"
					&& firstIncComment.loc!.start.line !== lastIncComment.loc!.end.line
					&& firstIncComment === lastIncComment
				)
				|| (
					options.consistent
					&& openBracket.loc.end.line !== maybeOpenBrace.loc.start.line
				)
			);

			/**
			 * Use tokens or comments to check multiline or not.
			 * But use only tokens to check whether linebreaks are needed.
			 * This allows:
			 *     var arr = [ // eslint-disable-line foo
			 *         'a'
			 *     ]
			 */
			if (options.bracesSameLine && ASTUtils.isOpeningBraceToken(maybeOpenBrace)) {
				if (ASTUtils.isCommaToken(maybeCloseBrace)) {
					maybeCloseBrace = sourceCode.getTokenBefore(maybeCloseBrace)!;
				}
				const next = sourceCode.getTokenAfter(maybeOpenBrace)!;
				const before = sourceCode.getTokenBefore(maybeCloseBrace)!;
				if (ASTUtils.isTokenOnSameLine(maybeOpenBrace, next)) {
					reportRequiredBeginningLinebreak(node, maybeOpenBrace);
				}
				if (ASTUtils.isTokenOnSameLine(maybeCloseBrace, before)) {
					reportRequiredEndingLinebreak(node, maybeCloseBrace);
				}
				if (!ASTUtils.isTokenOnSameLine(openBracket, maybeOpenBrace)) {
					reportNoBeginningLinebreak(node, openBracket);
				}
				if (!ASTUtils.isTokenOnSameLine(closeBracket, maybeCloseBrace)) {
					reportNoEndingLinebreak(node, closeBracket, maybeCloseBrace);
				}
			}
			else if (needsLinebreaks) {
				if (ASTUtils.isTokenOnSameLine(openBracket, maybeOpenBrace)) {
					reportRequiredBeginningLinebreak(node, openBracket);
				}
				if (ASTUtils.isTokenOnSameLine(maybeCloseBrace, closeBracket)) {
					reportRequiredEndingLinebreak(node, closeBracket);
				}
			}
			// If we have a comment before the first token in the array, we want to skip the code below
			else if (!ASTUtils.isCommentToken(maybeCommentBefore)) {
				if (!ASTUtils.isTokenOnSameLine(openBracket, maybeOpenBrace)) {
					reportNoBeginningLinebreak(node, openBracket);
				}
				if (!ASTUtils.isTokenOnSameLine(maybeCloseBrace, closeBracket)) {
					reportNoEndingLinebreak(node, closeBracket);
				}
			}
		}

		return {
			ArrayPattern: check,
			ArrayExpression: check,
		};
	},
});
