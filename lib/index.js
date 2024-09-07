"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const array_bracket_newline_1 = require("./rules/array-bracket-newline");
const array_element_newline_1 = require("./rules/array-element-newline");
exports.default = {
    meta: {
        name: '@incutonez/eslint-plugin'
    },
    rules: {
        'array-bracket-newline': array_bracket_newline_1.default,
        'array-element-newline': array_element_newline_1.default
    },
};
//# sourceMappingURL=index.js.map