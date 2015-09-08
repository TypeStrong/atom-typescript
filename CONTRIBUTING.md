# FAQ 

Please checkout [the FAQ](https://github.com/TypeStrong/atom-typescript/blob/master/docs/faq.md) before creating a new issue :rose:

# TIP
Before doing any meaningful work or even investigating [please create an issue for discussion](https://github.com/TypeStrong/atom-typescript/issues) so we don't have duplicate work and we don't step on your toes.

# Setup Dev Machine
Simply clone the repository, and then link the folder into your packages directory:

```bash
git clone https://github.com/TypeStrong/atom-typescript.git
cd atom-typescript
npm install
apm link -l
```

You still have to reload atom with `ctrl+alt+r` to test your changes.

(Note: [There is more guidance here](https://github.com/atom/atom/blob/master/docs/contributing-to-packages.md) but what we have is sufficient. `apm link -l` creates a symlink for the folder into `%HOMEPATH%\.atom\packages`)

**Optional**: If you are working on the binaries that are used if we deploy the package to NPM you can run (again from the directory that has `package.json`):

```bash
npm link
```

## Pull
Whenever you pull in latest changes, you should run `npm install`. Whenever we update to latest TypeScript we need to recompile all our js to make sure everybody gets the same code.

## Git
You need to have git. Note on windows long file paths can be an issue so run:

```
git config --system core.longpaths true
```
And use `Shift+Delete` to delete files if simple `delete` doesn't work.

# Various

## NTypeScript
We use a slightly modified (functionally equivalent) build of TypeScript called NTypeScript. The main motivation behind it is easier debugging and development workflow when consuming it as an NPM package. See [readme for details](https://github.com/TypeStrong/ntypescript#ntypescript).

Update the version used by Atom-TypeScript using `npm install ntypescript@latest --save --save-exact` and then do some manual testing, and then rebuild the whole project.

## Publishing

* If you have only fixed bugs in a backward-compatible way (or consider your changes very minimal), run `apm publish patch`.
* If you have implemented new functionality, run `apm publish minor`.
* For breaking changes run `apm publish major`. These must be justified with a reason documented in `changelog.md`

Additional Notes:
* The `apm` command does a lot for you *that you shouldn't do manually*. It automatically updates the `package.json` + `creates a git tag` + `pushes to git` + `pushes to apm`.
* On windows : storing your github password using `git config --global credential.helper wincred` helps smooth out the `apm publish <type>` experience.

## Workflow
**We develop atom-typescript with atom-typescript**

Some shortcuts:
* `ctrl+alt+i` will open the dev tools. These are the same Chrome dev tools you are familiar with. Feel free to inspect elements. This will come handy when doing UI or even seeing why a particular code element is highlighted in some way.
* `ctrl+alt+r` will reload the entire atom instance.

### Debugging
There are *lots of ways* to do this. The ones we use right now:

* You can do `console.error` from `projectService` and it will get logged to the atom's console (`ctrl+alt+i`). That's the quickest.
* You can call `projectService` in `sync` from the UI thread if you want to debug using atom's built in tools (`ctrl+alt+i`). Set `debugSync` to true in `./lib/worker/debug.ts`, and it takes care of the rest.

Also [if there is an error in `projectService` it gets logged to the console as a rejected promise](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/debugPromises.gif).

### General Steps
1. We open `atom-typescript` in one atom window
1. We have [`atom-typescript-examples`](https://github.com/TypeStrong/atom-typescript-examples) open in another atom window
1. We make changes to `atom-typescript` and save to get the JS.
1. We reload the `atom-typescript-examples` window to see the effects of our change.
1. Only reload the `atom-typescript` window once we are sure that our new code is functional.

#### When you break atom-typescript during development
This shouldn't happen as long as you leave the `atom-typescript` window untouched and do testing in another atom instance. If you reload the `atom-typescript` window thinking its going to be stable but it turns out to be unstable do one of the following:  
* Discard the *JavaScript* changes that you think broke it and reload the atom instance.
* Run `grunt` and leave it running to compile your atomts changes (as atomts is going to be out of order)
* Open up the visual studio project (at your own risk, we do not keep this up to date!)

## Architecture
We wrap the `languageService` + our custom `languageServiceHost` + [`projectFile`](https://github.com/TypeStrong/atom-typescript/blob/master/docs/tsconfig.md) into a `Project` (code in `Project.ts` in the `lang` folder). The functions that interact with this `project` are exposed from `projectService` ([the query / response section](https://github.com/TypeStrong/atom-typescript/blob/6fbf860eaf971baa3aca939626db553898cb40db/lib/main/lang/projectService.ts#L58-L244)). `projectService` is where you would add new features that interact with the language service. All this code is `sync` and can be tested / run on any node instance. Be careful not to *leave* `console.log` in this code (as we use `stdio` to make this code `async`) or use `atom` specific APIs (as it may not be in the UI thread).

We make this code `async`(and promise based) by:
* **Single line:** (e.g. `export var echo = childQuery(projectService.echo);`) for every new call to get good compile time safety ([see the code in `parent.ts`](https://github.com/TypeStrong/atom-typescript/blob/b0a862cf209d18982875d5c38e3a655594316e9a/lib/worker/parent.ts#L148-L158)).

### Additional Notes:
* `childQuery` takes the signature of the `sync` function from `projectService` of the form `Query->Response` and automatically creates an `async` function of the form `Query->Promise<Response>`. The function body from `projectService` is not used, just the function *name* and the *type information* is.
* We automatically add all functions exported from `projectService` in the list of functions that the child uses to respond to by name. ([see code in `child.ts`](https://github.com/TypeStrong/atom-typescript/blob/b0a862cf209d18982875d5c38e3a655594316e9a/lib/worker/child.ts#L48-L51)). Here we are not concerned with the *type information*. Instead we will actively *call the function* added to responders by *name*.
* We spawn a separate `atom` (or `node` on windows) instance and use `ipc` ([see code in `parent.ts`](https://github.com/TypeStrong/atom-typescript/blob/b0a862cf209d18982875d5c38e3a655594316e9a/lib/worker/parent.ts#L4-L141)). Also [reason for not using WebWorkers](https://github.com/atom/atom-shell/issues/797).

Advantage: you only need to define the query/response interface once (in `projectService.ts`) and write it in a testable `sync` manner. The parent code is never out of sync from the function definition (thanks to `childQuery`). Adding new functions is done is a typesafe way as you would write any other sync function + additionally using only one additional line of code in `parent.ts` (`childQuery`).

## Language Service Documentation
The TypeScript Language service docs: https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API

## Showing errors in atom
Done using the `linter` plugin. If you think about it. TypeScript is really just a super powerful version of `jshint` and that is the reason to use `linter` for errors.

You need to inherit from `Linter` class from the `linter`: http://atomlinter.github.io/Linter/
```js
var linterPath = atom.packages.getLoadedPackage("linter").path
var Linter:LinterClass = require linterPath+"/lib/linter"
```
Just look at `linter.ts` in our code.

## Grammar

Please see https://github.com/TypeStrong/atom-typescript/tree/master/docs/grammar.md


## QuickFix
The quickest way is to copy an existing one located in the [quick fix directory](https://github.com/TypeStrong/atom-typescript/tree/a91f7e0c935ed2bdc2c642350af50a7a5aed70ad/lib/main/lang/fixmyts/quickFixes). Copy one of these files into a new quick fix.

Quick fixes need to implement the `QuickFix` interface ([code here](https://github.com/TypeStrong/atom-typescript/blob/a91f7e0c935ed2bdc2c642350af50a7a5aed70ad/lib/main/lang/fixmyts/quickFix.ts#L46-L53)).

Once you have the quickfix created just put it into the [quickfix registry](https://github.com/TypeStrong/atom-typescript/blob/a91f7e0c935ed2bdc2c642350af50a7a5aed70ad/lib/main/lang/fixmyts/quickFixRegistry.ts#L14-L24) so that the infrastructure picks it up.

**Additional Tips** : One indespensible tool when creating a quick fix is the [AST viewer](https://github.com/TypeStrong/atom-typescript#ast-visualizer) which allows you to investigate the TypeScript language service view of the file.
