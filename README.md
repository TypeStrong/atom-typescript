# Atom TypeScript

[![Join the chat at https://gitter.im/TypeStrong/atom-typescript](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/TypeStrong/atom-typescript?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

JavaScript developers can now just open a `.ts` file and start hacking away like they are used to. No `grunt` no `Visual Studio`. Just pure coding.

## Installation

1. Install [atom](https://atom.io).
2. `apm install atom-typescript` (`apm` needs `git` in your path)
3. Fire up atom. Open a TypeScript file. Potentially wait for further installs (just `apm install linter` if its not there already).

**Additional Notes**: [Some packages we love](https://github.com/TypeStrong/atom-typescript/blob/master/docs/packages.md).

## Reviews
*Featured on the TypeScript home page under tools http://www.typescriptlang.org/* and [demoed by **Anders Hejlsberg**](https://twitter.com/schwarty/status/593858817894404096).

"I was shocked at how good it felt to poke around on the compiler with it." [Jonathan Turner](https://twitter.com/jntrnr)  
"And guess what, it worked perfectly. Like everything else! Faster than Visual Studio!" [Daniel Earwicker](http://stackoverflow.com/users/27423/daniel-earwicker)  
"It's a thing of beauty - they had me at '*Type information on hover*'. Discovering  `tsconfig.json` support as well was just an enormous bonus." [John Reilly](https://twitter.com/johnny_reilly)  
"This may be your best option for editing TypeScript at the moment - very nice!" [Rasmus Schultz](https://twitter.com/mindplaydk)

[*Add yours!*](https://github.com/TypeStrong/atom-typescript/issues/66)

# Features
* Autocomplete
* Live error analysis
* Type information on hover
* Compile on save
* Project Context Support (`tsconfig.json`)
* Project Build Support
* `package.json` Support
* React Support
* Format code
* Goto Declaration
* Find References
* Block comment and uncomment
* Goto history (goto next/previous error in open files, goto next/previous build)
* Auto indent for new lines
* TypeScript context menu
* Symbols in Project
* Symbols in File
* Semantic View
* Rename refactoring
* Quick Fix
* Toggle Breakpoint
* Common Snippets
* `import` / `/// <reference` relative path resolution
* Output Toggle
* AST visualizer
* Dependency View
* Sync

# FAQ
Located online : https://github.com/TypeStrong/atom-typescript/blob/master/docs/faq.md

----

# Feature Details
## Auto Complete
Internally using AutoComplete+. Just start typing and hints will show up. Or you can explicitly trigger it using `ctrl+space` or `cmd+space`. Press `tab` to make a selection.

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/fastErrorCheckingAndAutoComplete2.gif)


## Type information on hover
Just hover

![you definitely get the point](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/docs/screens/hover.png)

## Compile on save
TypeScript files will be compiled on save. Different notifications are given if `emit` was successful or not. [Configuration driven by `tsconfig.json`](https://github.com/TypeStrong/atom-typescript/blob/master/docs/tsconfig.md)

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/docs/screens/compile%20success.png)

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/docs/screens/compile%20error.png)

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/docs/screens/emit%20error.png)

## Project Support
Supported via `tsconfig.json` ([read more](https://github.com/TypeStrong/atom-typescript/blob/master/docs/tsconfig.md)) which is going to be the defacto Project file format for the next versions of TypeScript.

It also supports `filesGlob` which will expand `files` for you based on `minmatch|glob|regex` (similar to grunt).

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/docs/screens/proj.png)

### Project Build Support
Shortcut: `F6`. If there are any errors they are shown as well.

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/docs/screens/build%20success.png)

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/docs/screens/build%20errors.png)

## NPM Module Support
We have a sample NPM module : https://github.com/basarat/ts-npm-module  (trick : in tsconfig have `"declaration" : true` an in package.json have a `typings` field pointing to the `main` file) and its usage is demoed in https://github.com/basarat/ts-npm-module-consume.

## React Support

### Configuration tips

Covered here : http://basarat.gitbooks.io/typescript/content/docs/jsx/tsx.html

### Html to TSX

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/htmltotsx.gif)

## Format Code
Shortcut : `ctrl+alt+l` or `cmd+alt+l`. Will format just the selection if you have something selected otherwise it will format the entire file.

## Go to Declaration
Shortcut : `F12`. Will open the *first* declaration of the said item for now. (Note: some people call it Go to Definition)

## Find References
Shortcut `shift+F12`. Also called *find usages*.

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/findReferences.png)

## Block Comment and Uncomment
`ctrl+/` or `cmd+/`. Does a block comment / uncomment of code.

## Go to Next / Go to Previous
`f8` and `shift+f8` respectively. This will go to next/previous *errors in open files* OR *build error* OR *references* based on which tab you have selected.

## Context menu
Quickly toggle the TypeScript panel OR select active TypeScript panel tab and other stuff using the context menu. `ctrl+;` or `cmd+;`.

## Symbols View
Integrates with atom's symbols view (`ctrl+r` or `cmd+r`) to provide you with a list of searchable symbols in the current file.

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/symbolsView.gif)

## Semantic View
A bird's eye view of the current file. Use command `toggle semantic view`. The view updates while you edit the code. You can also click to jump to any portion of the file.

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/semanticView.png)

## Project Symbols View
Also called Go To Type in other IDEs. Integrates with atom's project level symbols (`ctrl+shift+r` or `cmd+shift+r`) to provide you with a list of searchable symbols in the *entire typescript project*.

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/projectSymbolView.png)

## Refactoring

### Rename
`f2` to initiate rename. `enter` to commit and `esc` to cancel.
![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/docs/screens/renameRefactoring.png)

## Quick Fix
Press the `TypeScript: Quick Fix` shortcut `alt+enter` at an error location to trigger quick fixes. Select the quick fix you want and press `enter` to commit e.g

### Add class members
![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/addClassMember.gif)

### More Quick fixes
We are actively adding quick fixes so [**go here for an up to date list**](https://github.com/TypeStrong/atom-typescript/blob/master/docs/quickfix.md).

## Toggle Breakpoint
Use command `TypeScript: Toggle Breakpoint` shortcut `f9`:

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/toggleBreakpoint.gif)

## tsconfig validation
We will validate it and help you to fix it :)
![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/errorcases/invalidProjectOptions/invalidProjectOptions.gif)

## Snippets
### Relative Paths
Relative paths have traditionally been a pain, not anymore. Use `import` or `ref` and press `tab` to trigger snippet.

`ref`

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/ref%20snippet.gif)

`import`

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/import%20snippet.gif)

Note that within the path string you get autocomplete (`ctrl+space`/`cmd+space`) for all the files in the project by filename (works for both `ref` and `import`).

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/pathChange.gif)

## Output Toggle
`ctrl+shift+m` to toggle the output co**m**piled JS file for a give TypeScript file. The keyboard shortcut is consistent with atom's markdown preview.

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/outputToggle.gif)

## AST Visualizer
Command : `Typescript: Ast`. Useful when authoring new features.
![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/astVisualizer.gif)

Also command : `TypeScript: Ast Full` that includes the `trivia` (punctuation, comments etc. received from `ts.Node.getChildren()`) as well.
![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/astFull.png)

## Dependency View
Command : `Typescript: Dependency View`. A dependency viewer for insight into the project if you use external modules. You can zoom, pan, drag points around and hover over nodes. ([more details](https://github.com/TypeStrong/atom-typescript/blob/master/docs/dependency-view.md))
![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/dependencyView/teaser.png)

## Sync
We try to keep as much of the stuff in sync while you edit code. However *in dire circumstances*:

* a soft sync is done when you save a file `ctrl+s` and we will completely reprocess the *active* file. This might not fix stuff if the error is because of *some other file on the file system*.
* `ctrl+'` or `cmd+'` : If you deleted files in the background or renamed them or jumped git branches or *something weird just happened* then sync. No need to restart your IDE :).

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/sync.gif)

## Contributing

Look at [CONTRIBUTING.md](https://github.com/TypeStrong/atom-typescript/blob/master/CONTRIBUTING.md) for curiosity. We work hard to keep the code as approachable as possible and are highly keen on helping you help us.

## Changelog
Breaking changes [available online](https://github.com/TypeStrong/atom-typescript/blob/master/docs/CHANGELOG.md).

## Donating
Support this project and [others by basarat][gratipay-basarat] via [gratipay][gratipay-basarat].

[![Support via Gratipay][gratipay]][gratipay-basarat]

[gratipay]: https://cdn.rawgit.com/gratipay/gratipay-badge/2.3.0/dist/gratipay.png
[gratipay-basarat]: https://gratipay.com/basarat/
