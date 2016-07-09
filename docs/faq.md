# FAQ

## Syntax Highlighting is bad

For grammar issues go here : https://github.com/Microsoft/TypeScript-TmLanguage/issues and link back to us if you want us to pull from upstream 🌹.

More on how our grammar is managed : https://github.com/TypeStrong/atom-typescript/blob/master/docs/grammar.md

## I keep getting changes to tsconfig.json
This is probably because of us keeping `files` updated with the `filesGlob` option. The reason why we do this is because the official `tsconfig.json` spec does not support `filesGlob`. Therefore we keep `files` in sync with the `filesGlob` so that your team mates can use whatever editor they prefer (sublime text, visual studio etc.).

You can now disable this behavior by setting the `rewriteTsconfig` flag to `false` in your project's `tsconfig.json` under the `atom` key.

[Further Details](https://github.com/TypeStrong/atom-typescript/blob/master/docs/tsconfig.md#atom)

## For really large projects atom-typescript gets slow
If you have `tsconfig.json` in a folder that contains `node_modules`, atom-typescript might become slow (due to extensive file listing). Two possible fixes:
* Move `tsconfig.json` into a sub folder e.g. `src`
* Add a `filesGlob` that excludes `node_modules` e.g.:

```ts
"filesGlob" : [
    "**/*.ts",
    "**/*.tsx",
    "!node_modules/**",
];
```

[Further Details](https://github.com/TypeStrong/atom-typescript/issues/648).

## I don't want atom-typescript compiling my js
Set `compileOnSave : false` in your tsconfig.json (https://github.com/TypeStrong/atom-typescript/blob/master/docs/tsconfig.md#compileonsave).  Then you've got all the intellisense / refactoring goodness of atom-typescript but no generated JavaScript.  Why is this useful?  Well you might be using something else for your build such as [ts-loader](https://github.com/TypeStrong/ts-loader) or [tsify](https://github.com/TypeStrong/tsify) or [gulp-typescript](https://github.com/ivogabe/gulp-typescript).

## Which version of TypeScript does atom-typescript use?
It uses [ntypescript](https://github.com/TypeStrong/ntypescript) which is just a build of Microsoft/Master.  This means it's the latest and greatest of the TypeScript goodness (You can see the last date it was updated in our [`package.json`](https://github.com/TypeStrong/atom-typescript/blob/master/package.json) e.g. `"ntypescript": "1.201603290104.1",` means `2016-03-29`).  There is a possibility that in the future it will move to TypeScript nightlies but our current automation is working well.

## Can I use a custom TypeScript compiler?
If it conforms the latest TypeScript services API then yes! Just set the path to `typescriptServices.js` in the package options.  

## Can I use an alternate transpiler?
Atom-typescript supports using Babel as an alternate ES5 transpiler in coordination with the TypeScript language service.  This may be useful if TypeScript does not yet support transpiling a certain feature correctly (for example [scope per for loop iteration with let](https://github.com/Microsoft/TypeScript/issues/3915)).

To enable using Babel as the transpiler, make these changes to your `tsconfig.json` file:

**1:** Add this key in the root:

```js
{
 "externalTranspiler": "babel"
}
```
**2:** Set the `target` compiler option to `"es6"`.  This is not *technically* required, but if you don't do this, you'll just be transpiling an already-transpiled file.

Note that atom-typescript's Babel integraion works with in concert with the `removeComments`, `sourceMap`, and `inlineSourceMap` compiler options settings in `tsconfig.json`, so those items should just work as expected.  Any source maps should be doubly-mapped back to the original TypeScript.

## I prefer single (or double) quotes
You can set that in the package settings https://atom.io/docs/latest/using-atom-atom-packages#package-settings

## Atom Typescript is complaining about not finding files or other weird errors
You probably deleted them or added them or moved them around. We don't watch the file system as it is memory intensive and unreliable across operating systems. You can ask atom-typescript to do a rescan of your file system using the `sync` command (https://github.com/TypeStrong/atom-typescript#sync)

## Failed to Update
This can happen particularly on windows ([relevant issue](https://github.com/TypeStrong/atom-typescript/issues/195)) as it is not possible to delete a file if it is executing. Close all atom instances and run the following commands:

```
apm uninstall atom-typescript
apm install atom-typescript
```

## Failed to install
Follow the same steps as specified in failed to update.

## How can I contribute
see https://github.com/TypeStrong/atom-typescript/blob/master/CONTRIBUTING.md
