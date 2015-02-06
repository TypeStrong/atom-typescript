# TIP
Before doing any meaningful work or even investigating [please create an issue for discussion](https://github.com/TypeStrong/atom-typescript/issues) so we don't have duplicate work and I don't step on your toes.

# Grunt Tasks
## Building 
`grunt build`

## Developing
`grunt`

## Publishing
`apm publish minor`

# Setup Dev Machine
Best solution I have found is to simply clone at your packages directory. On Windows: 

```bash
cd %HOMEPATH%\.atom\packages
git clone https://github.com/TypeStrong/atom-typescript.git 
```

# Various

## Architecture
We wrap the stuff we need from the `languageService` behind `programManager.ts` and the `lang` folder. All this code is `sync` and can be tested / run on any node instance. The main functions are exposed from the bottom of `programManager` ([see code](https://github.com/TypeStrong/atom-typescript/blob/a90bd067bba8656e41c6e1ed3c1bdea06118274f/lib/main/lang/programManager.ts#L228-L408)). Be careful not to *leave* `console.logs` in this code or use `atom` specific apis. 

We make this code `async`(and promise based) by: 

* **Code you don't need to touch** spawning a seperate `atom` (or `node` on windows) instance and using `ipc` ([see code in `parent.ts`](https://github.com/TypeStrong/atom-typescript/blob/a90bd067bba8656e41c6e1ed3c1bdea06118274f/lib/worker/parent.ts#L16-L78)).
* **Single line:** (e.g. `export var echo = childQuery(programManager.echo);`) for every new call to get good compile time safety. Wrapping the `sync` functions from `programManager` in a `childQuery` function that automatically converts a `Query->Response` function to `Query->Promise<Response>` function ([see code in `parent.ts`](https://github.com/TypeStrong/atom-typescript/blob/a90bd067bba8656e41c6e1ed3c1bdea06118274f/lib/worker/parent.ts#L132-L142)). Note that the function body from `programManager` is not used, just the function *name* and the *type information* is.
* **Single line**: (e.g.`addToResponders(programManager.echo);`) for every new call to add a function as a response by the worker ([see code in `child.ts`](https://github.com/TypeStrong/atom-typescript/blob/a90bd067bba8656e41c6e1ed3c1bdea06118274f/lib/worker/child.ts#L45-L56)). Here we are not concerned with the *type information*. Instead we will actively *call the function* added to responders by *name*.
 
Advantage: you only need to define the query/response interface once (in `programManager.ts`) and write it in a testable `sync` manner. The parent code is never out of sync from the function definition (thanks to `childQuery`). Adding new functions is done is a typesafe way as you would write any other sync function + additionally using only two lines of code, one in `parent.ts` and one in `child.ts`. 

## Debugging
There are *lots of ways* to do this. All of these are equivalent IMHO:
 
* As mentioned the code in `programManager` is sync and testable *very* easily using just a node testing framework or simple node `require` scripts.
* You can call `programManager` in `sync` from the UI thread if you need to and debug using `atom`s built in tools (`ctrl+alt+i`). That's what I've been doing. 
* You can spawn the child with `node` (don't use `atom` although it might work) with `--debug` flag enabled and use something like `node-inspector` ([see code](https://github.com/TypeStrong/atom-typescript/blob/a90bd067bba8656e41c6e1ed3c1bdea06118274f/lib/worker/parent.ts#L24)). 

## Getting the language service
The TypeScript Language service : https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API

## Depending upon other atom packages
There isn't a documented way : https://discuss.atom.io/t/depending-on-other-packages/2360/16 

So using https://www.npmjs.com/package/atom-package-dependencies 

```js
var apd = require('atom-package-dependencies');

var mdp = apd.require('markdown-preview');
mdp.toggle();

// Also
apd.install();
```

## Showing errors in atom
Done using the `linter` plugin. If you think about it. TypeScript is really just a super powerful version of `jshint` and that is the reason to use `linter` for errors. 

You need to inherit from `Linter` class from the `linter`: http://atomlinter.github.io/Linter/ 
```js
var linterPath = atom.packages.getLoadedPackage("linter").path
var Linter:LinterClass = require linterPath+"/lib/linter"
```
Just look at `linter.ts` in our code.

