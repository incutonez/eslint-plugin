# Purpose

I wanted my braces in objects (and arrays) to be on the same line as each other and the brackets of an array, so I had to alter 2 ESLint properties [array-bracket-newline](https://eslint.org/docs/latest/rules/array-bracket-newline) and [array-element-newline](https://eslint.org/docs/latest/rules/array-element-newline).  This repo contains those overrides.  See also this [SO Question](https://stackoverflow.com/questions/55502657/js-array-of-objects-formatting).

I basically ported the ESLint code from [here](https://github.com/eslint/eslint/blob/ba89c73261f7fd1b6cdd50cfaeb8f4ce36101757/lib/rules/array-bracket-newline.js) and [here](https://github.com/eslint/eslint/blob/ba89c73261f7fd1b6cdd50cfaeb8f4ce36101757/lib/rules/array-element-newline.js) to TypeScript, added a new property `bracesSameLine` (which is a boolean), and modified the `check` functions to use this property and determine how to format properly.

It will correct braces that are on a different line as the open/close brace/bracket, like this:

```ts
const invalid = {
    someFunction: function() {

    },

    arr: [
        {
            thing: 1
        },
        {
            one: 2
        }
    ]
};

const valid = {
    someFunction: function() {

    },

    arr: [{
        thing: 1,
    }, {
        one: 2,
    }],
};
```

# Installation and Usage

`npm i @incutonez/eslint-plugin`

Then in your ESLint config file, add the following:
- In `plugins`, add `@incutonez`
- In `rules`, add:
```
"@incutonez/array-element-newline": [
  "error",
  {
    "multiline": true,
    "minItems": 5,
    "bracesSameLine": true
  }
],
"@incutonez/array-bracket-newline": [
  "error",
  {
    "multiline": true,
    "minItems": 5,
    "bracesSameLine": true
  }
],
```
