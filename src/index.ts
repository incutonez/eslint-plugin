import arrayBracketNewline from "./rules/array-bracket-newline";

const PREFIX = '@incutonez';

export = {
    configs: {
        recommended: {
            parser: '@typescript-eslint/parser',
            parserOptions: {
                sourceType: "module",
                ecmaVersion: "latest"
            },
            plugins: [PREFIX],
            rules: {
                [`${PREFIX}/array-bracket-newline`]: 'error',
            },
        },
    },
    rules: {
        'array-bracket-newline': arrayBracketNewline
    },
};
