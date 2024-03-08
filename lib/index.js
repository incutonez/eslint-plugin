"use strict";
const array_bracket_newline_1 = require("./rules/array-bracket-newline");
const PREFIX = '@incutonez';
module.exports = {
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
        'array-bracket-newline': array_bracket_newline_1.default
    },
};
//# sourceMappingURL=index.js.map