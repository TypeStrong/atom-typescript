# `tsconfig.json`
A unified project format for TypeScript ([see merged PR on Microsoft/TypeScript](https://github.com/Microsoft/TypeScript/pull/1692)). The TypeScript compiler (`1.5` and above) only cares about `compilerOptions` and `files`. We add additional features to this [with the typescript team's approval to extend the file as long as we don't conflict](https://github.com/Microsoft/TypeScript/issues/1955).

`tsconfig.json` is great for building the ["compilation context" so you **don't need to use** `/// <reference` comments](http://blog.icanmakethiswork.io/2015/02/hey-tsconfigjson-where-have-you-been.html).

# Basic
The minimal `tsconfig.json` file you need is:
```json
{}
```
i.e. an empty JSON file at the *root* of your project :heart: This will be sufficient for most people.

# Options

* [`compilerOptions`](https://github.com/TypeStrong/atom-typescript/blob/e2fa67c4715189b71430f766ed9a92d9fb3255f9/lib/main/tsconfig/tsconfig.ts#L8-L35): similar to what you would pass on the commandline to `tsc`.
  * One exception : [We don't support `--out` because it will hurt you in the long run, and we will warn you if you use it](https://github.com/TypeStrong/atom-typescript/blob/master/docs/out.md).
* [`filesGlob`](https://github.com/TypeStrong/atom-typescript/blob/master/docs/tsconfig.md#filesglob): To make it easier for you to just add / remove files in your project we add `filesGlob` which accepts an array of `glob / minimatch / RegExp` patterns (similar to grunt) to specify source files.
* [`formatCodeOptions`](https://github.com/TypeStrong/atom-typescript/blob/master/docs/tsconfig.md#formatcodeoptions) : Code formatting options
* [`compileOnSave`](https://github.com/TypeStrong/atom-typescript/blob/master/docs/tsconfig.md#compileonsave) : Should AtomTS compile on save
* [`version`](https://github.com/TypeStrong/atom-typescript/blob/master/docs/tsconfig.md#version): The TypeScript version


## Examples

### filesGlob

Note: `files` is kept up to date by expansion of `filesGlob`.  This is because `files` is standard across all IDEs vs. `filesGlob` is specific to atom-typescript.

A default `filesGlob` is available for you as a snippet : `fg`

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
        "!./node_modules/**/*.ts"
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

### formatCodeOptions
These are used when you request the IDE to format TypeScript code.

```json
{
    "formatCodeOptions": {
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

### compileOnSave
We highly recommend you leave it as the default (true). But if you want you can can disable compile on save from IDEs. This allows you to leave the compilation to external tools. [This is planned to be supported by other IDEs as well.](https://github.com/Microsoft/TypeScript/issues/2326)

### version
This exists simply to make it easier for the future you to know which TypeScript version was used when this project file was created. You can read more here [Microsoft/TypeScript#2113](https://github.com/Microsoft/TypeScript/issues/2133)

## Additional Notes
FWIW [a json schema is also available](http://json.schemastore.org/tsconfig)
