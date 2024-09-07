"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@typescript-eslint/utils");
exports.default = utils_1.ESLintUtils.RuleCreator.withoutDocs({
    defaultOptions: [],
    meta: {
        type: "layout",
        docs: {
            description: "Enforce line breaks after each array element",
        },
        fixable: "whitespace",
        schema: {
            definitions: {
                basicConfig: {
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
                                }
                            },
                            additionalProperties: false,
                        },
                    ],
                },
            },
            type: "array",
            items: [
                {
                    oneOf: [
                        {
                            $ref: "#/definitions/basicConfig",
                        },
                        {
                            type: "object",
                            properties: {
                                ArrayExpression: {
                                    $ref: "#/definitions/basicConfig",
                                },
                                ArrayPattern: {
                                    $ref: "#/definitions/basicConfig",
                                },
                            },
                            additionalProperties: false,
                            minProperties: 1,
                        },
                    ],
                },
            ],
        },
        messages: {
            unexpectedLineBreak: "There should be no linebreak here.",
            missingLineBreak: "There should be a linebreak after this element.",
        },
    },
    create(context) {
        const sourceCode = context.sourceCode;
        //----------------------------------------------------------------------
        // Helpers
        //----------------------------------------------------------------------
        /**
         * Normalizes a given option value.
         * @param {string|Object|undefined} providedOption An option value to parse.
         * @returns {{multiline: boolean, minItems: number}} Normalized option object.
         */
        function normalizeOptionValue(providedOption) {
            let consistent = false;
            let bracesSameLine = false;
            let multiline = false;
            let minItems;
            const option = providedOption || "always";
            if (!option || option === "always" || option.minItems === 0) {
                minItems = 0;
            }
            else if (option === "never") {
                minItems = Number.POSITIVE_INFINITY;
            }
            else if (option.bracesSameLine) {
                bracesSameLine = true;
                minItems = option.minItems || Number.POSITIVE_INFINITY;
            }
            else if (option === "consistent") {
                consistent = true;
                minItems = Number.POSITIVE_INFINITY;
            }
            else {
                multiline = Boolean(option.multiline);
                minItems = option.minItems || Number.POSITIVE_INFINITY;
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
         * @param {string|Object|undefined} options An option value to parse.
         * @returns {{ArrayExpression: {multiline: boolean, minItems: number}, ArrayPattern: {multiline: boolean, minItems: number}}} Normalized option object.
         */
        function normalizeOptions(options) {
            if (options && (options.ArrayExpression || options.ArrayPattern)) {
                let expressionOptions, patternOptions;
                if (options.ArrayExpression) {
                    expressionOptions = normalizeOptionValue(options.ArrayExpression);
                }
                if (options.ArrayPattern) {
                    patternOptions = normalizeOptionValue(options.ArrayPattern);
                }
                return {
                    ArrayExpression: expressionOptions,
                    ArrayPattern: patternOptions,
                };
            }
            const value = normalizeOptionValue(options);
            return {
                ArrayExpression: value,
                ArrayPattern: value,
            };
        }
        /**
         * Reports that there shouldn't be a line break after the first token
         * @param {Token} token The token to use for the report.
         * @returns {void}
         */
        function reportNoLineBreak(token) {
            const tokenBefore = sourceCode.getTokenBefore(token, {
                includeComments: true,
            });
            if (!tokenBefore) {
                return;
            }
            context.report({
                loc: {
                    start: tokenBefore.loc.end,
                    end: token.loc.start,
                },
                messageId: "unexpectedLineBreak",
                fix(fixer) {
                    if (utils_1.ASTUtils.isCommentToken(tokenBefore)) {
                        return null;
                    }
                    if (!utils_1.ASTUtils.isTokenOnSameLine(tokenBefore, token)) {
                        return fixer.replaceTextRange([tokenBefore.range[1], token.range[0]], " ");
                    }
                    /*
                     * This will check if the comma is on the same line as the next element
                     * Following array:
                     * [
                     *     1
                     *     , 2
                     *     , 3
                     * ]
                     *
                     * will be fixed to:
                     * [
                     *     1, 2, 3
                     * ]
                     */
                    const twoTokensBefore = sourceCode.getTokenBefore(tokenBefore, {
                        includeComments: true,
                    });
                    if (!twoTokensBefore || utils_1.ASTUtils.isCommentToken(twoTokensBefore)) {
                        return null;
                    }
                    return fixer.replaceTextRange([twoTokensBefore.range[1], tokenBefore.range[0]], "");
                },
            });
        }
        function reportRequiredBeginningLinebreak(node, token) {
            context.report({
                node,
                loc: token.loc,
                messageId: "missingLineBreak",
                fix(fixer) {
                    return fixer.insertTextAfter(token, "\n");
                },
            });
        }
        function reportNoBeginningLinebreak(node, token) {
            context.report({
                node,
                loc: token.loc,
                messageId: "missingLineBreak",
                fix(fixer) {
                    const nextToken = sourceCode.getTokenAfter(token, {
                        includeComments: true,
                    });
                    if (!nextToken || utils_1.ASTUtils.isCommentToken(nextToken)) {
                        return null;
                    }
                    return fixer.removeRange([token.range[1], nextToken.range[0]]);
                },
            });
        }
        /**
         * Reports that there shouldn't be a linebreak before the last token
         * @param node The node to report in the event of an error.
         * @param token The token to use for the report.
         */
        function reportNoEndingLinebreak(node, token) {
            context.report({
                node,
                loc: token.loc,
                messageId: "missingLineBreak",
                fix(fixer) {
                    const previousToken = sourceCode.getTokenBefore(token, {
                        includeComments: true,
                    });
                    if (!previousToken || utils_1.ASTUtils.isCommentToken(previousToken)) {
                        return null;
                    }
                    return fixer.replaceTextRange([previousToken.range[1], token.range[0]], " ");
                },
            });
        }
        function reportRequiredEndingLinebreak(node, token) {
            context.report({
                node,
                loc: token.loc,
                messageId: "missingLineBreak",
                fix(fixer) {
                    return fixer.insertTextBefore(token, "\n");
                },
            });
        }
        /**
         * Reports that there should be a line break after the first token
         */
        function reportRequiredLineBreak(token) {
            const tokenBefore = sourceCode.getTokenBefore(token, {
                includeComments: true,
            });
            if (!tokenBefore) {
                return;
            }
            context.report({
                loc: {
                    start: tokenBefore.loc.end,
                    end: token.loc.start,
                },
                messageId: "missingLineBreak",
                fix(fixer) {
                    return fixer.replaceTextRange([tokenBefore.range[1], token.range[0]], "\n");
                },
            });
        }
        function check(node) {
            // @ts-expect-error type cast
            const elements = node.elements;
            // @ts-expect-error type cast
            const normalizedOptions = normalizeOptions(context.options[0]);
            // @ts-expect-error type cast
            const options = normalizedOptions[node.type];
            if (!options) {
                return;
            }
            let elementBreak = false;
            /*
             * MULTILINE: true
             * loop through every element and check
             * if at least one element has linebreaks inside
             * this ensures that following is not valid (due to elements are on the same line):
             *
             * [
             *      1,
             *      2,
             *      3
             * ]
             */
            if (options.multiline) {
                elementBreak = elements
                    .filter((element) => element !== null)
                    .some((element) => element.loc.start.line !== element.loc.end.line);
            }
            let linebreaksCount = 0;
            // @ts-expect-error type cast
            for (let i = 0; i < node.elements.length; i++) {
                // @ts-expect-error type cast
                const element = node.elements[i];
                const previousElement = elements[i - 1];
                if (i === 0 || element === null || previousElement === null) {
                    continue;
                }
                const commaToken = sourceCode.getFirstTokenBetween(previousElement, element, utils_1.ASTUtils.isCommaToken);
                const lastTokenOfPreviousElement = sourceCode.getTokenBefore(commaToken);
                const firstTokenOfCurrentElement = sourceCode.getTokenAfter(commaToken);
                if (!utils_1.ASTUtils.isTokenOnSameLine(lastTokenOfPreviousElement, firstTokenOfCurrentElement)) {
                    linebreaksCount++;
                }
            }
            const needsLinebreaks = (elements.length >= options.minItems ||
                (options.multiline &&
                    elementBreak) ||
                (options.consistent &&
                    linebreaksCount > 0 &&
                    linebreaksCount < elements.length));
            elements.forEach((element, i) => {
                const previousElement = elements[i - 1];
                if (i === 0 || element === null || previousElement === null) {
                    return;
                }
                const commaToken = sourceCode.getFirstTokenBetween(previousElement, element, utils_1.ASTUtils.isCommaToken);
                const maybeCloseBraceToken = sourceCode.getTokenBefore(commaToken);
                const maybeOpenBraceToken = sourceCode.getTokenAfter(commaToken);
                if (options.bracesSameLine && utils_1.ASTUtils.isOpeningBraceToken(maybeOpenBraceToken)) {
                    const next = sourceCode.getTokenAfter(maybeOpenBraceToken);
                    const before = sourceCode.getTokenBefore(maybeCloseBraceToken);
                    /* Let's make sure we don't have an open bracket in the line before.
                     * Also let's make a check to see if our opening brace IS on the same line as a closing brace */
                    if (!utils_1.ASTUtils.isOpeningBracketToken(before) && utils_1.ASTUtils.isClosingBraceToken(maybeCloseBraceToken) && utils_1.ASTUtils.isTokenOnSameLine(maybeCloseBraceToken, before)) {
                        reportRequiredEndingLinebreak(node, maybeCloseBraceToken);
                    }
                    if (utils_1.ASTUtils.isTokenOnSameLine(maybeOpenBraceToken, next)) {
                        reportRequiredBeginningLinebreak(node, maybeOpenBraceToken);
                    }
                    if (!utils_1.ASTUtils.isTokenOnSameLine(maybeCloseBraceToken, commaToken)) {
                        reportNoBeginningLinebreak(node, maybeCloseBraceToken);
                    }
                    if (!utils_1.ASTUtils.isTokenOnSameLine(commaToken, maybeOpenBraceToken)) {
                        reportNoEndingLinebreak(node, maybeOpenBraceToken);
                    }
                }
                else if (needsLinebreaks) {
                    if (utils_1.ASTUtils.isTokenOnSameLine(maybeCloseBraceToken, maybeOpenBraceToken)) {
                        reportRequiredLineBreak(maybeOpenBraceToken);
                    }
                }
                else {
                    if (!utils_1.ASTUtils.isTokenOnSameLine(maybeCloseBraceToken, maybeOpenBraceToken)) {
                        reportNoLineBreak(maybeOpenBraceToken);
                    }
                }
            });
        }
        //----------------------------------------------------------------------
        // Public
        //----------------------------------------------------------------------
        return {
            ArrayPattern: check,
            ArrayExpression: check,
        };
    },
});
//# sourceMappingURL=array-element-newline.js.map