# `tsconfig.json`
A unified project format for TypeScript. The TypeScript compiler (`1.4` and above) only cares about `compilerOptions` and `files`. We add additional features to this:

* `filesGlob`: To make it easier for you to just add / remove files in your project we add `filesGlob` which accepts an array of `glob / minimatch / RegExp` patterns (similar to grunt) to specify source files.


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
