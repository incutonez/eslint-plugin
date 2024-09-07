"use strict";
const array_bracket_newline_1 = require("./rules/array-bracket-newline");
const array_element_newline_1 = require("./rules/array-element-newline");
module.exports = {
    meta: {
        name: '@incutonez/eslint-plugin'
    },
    rules: {
        'array-bracket-newline': array_bracket_newline_1.default,
        'array-element-newline': array_element_newline_1.default
    },
};
//# sourceMappingURL=index.js.map