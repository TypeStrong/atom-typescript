# `tsconfig.json`
A unified project format for TypeScript. The TypeScript compiler (`1.4` and above) only cares about `compilerOptions` and `files`. We add additional features to this under the `typestrong` key:

* `filesGlob`: make it easier for you to just add / remove files we add `filesGlob` which will accepts n array of `glob / minimatch / RegExp` patterns to specify source files.


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
    "typestrong":{
        "filesGlob": [
            "./**/*.ts"
        ]
    },
	files:[
		
	]
}
```
