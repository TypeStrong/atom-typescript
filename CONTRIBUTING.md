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
apm link -d
```

You still have to reload atom with `ctrl+alt+r` or `ctrl+shift+f5` to test your changes.

Now you can use atom-typescript *to develop atom-typescript*. This is covered more in the workflow https://github.com/TypeStrong/atom-typescript/blob/master/CONTRIBUTING.md#workflow

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

## Publishing

* If you have only fixed bugs in a backward-compatible way (or consider your changes very minimal), run `apm publish patch`.
* If you have implemented new functionality, run `apm publish minor`. (A TypeScript update should at least be minor).
* For breaking changes run `apm publish major`. These must be justified with a reason documented in `changelog.md`

Additional Notes:
* The `apm` command does a lot for you *that you shouldn't do manually*. It automatically updates the `package.json` + `creates a git tag` + `pushes to git` + `pushes to apm`.
* On windows : storing your github password using `git config --global credential.helper wincred` helps smooth out the `apm publish <type>` experience.

## Workflow
**We develop atom-typescript with atom-typescript**

Some shortcuts:
* `ctrl+alt+i` will open the dev tools. These are the same Chrome dev tools you are familiar with. Feel free to inspect elements. This will come handy when doing UI or even seeing why a particular code element is highlighted in some way.
* `ctrl+alt+r` or `ctrl+shift+f5` will reload the entire atom instance.

### General Steps
1. We open `atom-typescript` in one atom window
1. We have [`atom-typescript-examples`](https://github.com/TypeStrong/atom-typescript-examples) open in another atom window as such: `atom --dev <examplesFolder>`
1. We make changes to `atom-typescript` and save to get the JS.
1. We reload the `atom-typescript-examples` (`ctrl+alt+r` or `ctrl+shift+f5`) window to see the effects of our change.
1. Only reload the `atom-typescript` window once we are sure that our new code is functional.

#### When you break atom-typescript during development
This shouldn't happen as long as you start the `atom-typescript` window _without_ the `--dev` flag, and do testing in another atom instance. If you reload the `atom-typescript` window thinking its going to be stable but it turns out to be unstable do one of the following:  
* Discard the *JavaScript* changes that you think broke it and reload the atom instance.

## Language Service Documentation
The TypeScript Language service docs: https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
The `tsserver` protocol definitions https://github.com/Microsoft/TypeScript/blob/master/lib/protocol.d.ts

## Showing errors in atom
Done using the `linter` plugin. If you think about it. TypeScript is really just a super powerful version of `jshint` and that is the reason to use `linter` for errors.
Just look at `linter.ts` in our code.

## Grammar

Please see https://github.com/TypeStrong/atom-typescript/tree/master/docs/grammar.md
