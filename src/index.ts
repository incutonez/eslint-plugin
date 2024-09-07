import arrayBracketNewline from "./rules/array-bracket-newline";
import arrayElementNewline from "./rules/array-element-newline";

// TODOJEF: Should migrate to flat config https://eslint.org/docs/latest/extend/plugins
export = {
    rules: {
        'array-bracket-newline': arrayBracketNewline,
        'array-element-newline': arrayElementNewline
    },
};
