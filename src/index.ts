import arrayBracketNewline from "./rules/array-bracket-newline";
import arrayElementNewline from "./rules/array-element-newline";

export default {
    meta: {
        name: '@incutonez/eslint-plugin'
    },
    rules: {
        'array-bracket-newline': arrayBracketNewline,
        'array-element-newline': arrayElementNewline
    },
};
