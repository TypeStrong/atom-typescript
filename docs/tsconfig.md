# `tsconfig.json`
A unified project format for TypeScript ([see merged PR on Microsoft/TypeScript](https://github.com/Microsoft/TypeScript/pull/1692)). The TypeScript compiler (`1.4` and above) only cares about `compilerOptions` and `files`. We add additional features to this [with the typescript team's approval to extend the file as long as we don't conflict](https://github.com/Microsoft/TypeScript/issues/1955):

* [`filesGlob`](https://github.com/TypeStrong/atom-typescript/blob/master/docs/tsconfig.md#filesglob): To make it easier for you to just add / remove files in your project we add `filesGlob` which accepts an array of `glob / minimatch / RegExp` patterns (similar to grunt) to specify source files.
* [`format`](https://github.com/TypeStrong/atom-typescript/blob/master/docs/tsconfig.md#format) : Code formatting options


## Examples

### filesGlob

Note: `files` is kept up to date by expansion of `filesGlob`.  

```json
{
    "compilerOptions": {
        "target": "es5",
        "module": "commonjs",
        "declaration": false,
        "noImplicitAny": false,
        "removeComments": true,
        "noLib": false
    },
    "filesGlob": [
        "./**/*.ts",
        "!node_modules/**/*.ts"
    ],
    "files": [
        "./globals.ts",
        "./linter.ts",
        "./main/atom/atomUtils.ts",
        "./main/atom/autoCompleteProvider.ts",
        "./worker/messages.ts",
        "./worker/parent.ts"
    ]
}
```
### format
We pass these to the TypeScript language service as code formatting options.

```json
{
    "format": {
        "indentSize": 4,
        "tabSize": 4,
        "newLineCharacter": "\r\n",
        "convertTabsToSpaces": true,
        "insertSpaceAfterCommaDelimiter": true,
        "insertSpaceAfterSemicolonInForStatements": true,
        "insertSpaceBeforeAndAfterBinaryOperators": true,
        "insertSpaceAfterKeywordsInControlFlowStatements": true,
        "insertSpaceAfterFunctionKeywordForAnonymousFunctions": false,
        "insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis": false,
        "placeOpenBraceOnNewLineForFunctions": false,
        "placeOpenBraceOnNewLineForControlBlocks": false
    }
}
```
