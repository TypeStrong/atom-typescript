# Atom TypeScript

[![Join the chat at https://gitter.im/TypeStrong/atom-typescript](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/TypeStrong/atom-typescript?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

JavaScript developers can now just open a `.ts` file and start hacking away like they are used to. No `grunt` no `Visual Studio`. Just pure coding.

**NOTE**: This branch contains a major rewrite (**v11**) of the `atom-typescript` plugin that is lighter and faster, but lacks a few major features that you might miss. The previous version is still available in the `legacy` branch and will continue to receive minor bugfixes, but I wouldn't count on any new developments.

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
* Goto Declaration
* Find References
* Block comment and uncomment
* Rename refactoring
* Common Snippets

# FAQ
Located online : https://github.com/TypeStrong/atom-typescript/blob/master/docs/faq.md

----

# Feature Details
## Auto Complete
Internally using AutoComplete+. Just start typing and hints will show up. Or you can explicitly trigger it using `ctrl+space` or `cmd+space`. Press `tab` to make a selection.

## Type information on hover
Just hover

![you definitely get the point](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/docs/screens/hover.png)

## Compile on save
When `"compileOnSave": true` is set in `tsconfig.json`, Typescript files will be compiled and saved automatically. The compiler does its best to emit something, even if there are semantic errors in the file.

## Project Support
`atom-typescript` supports all the same options the Typescript compiler does as it's using it behind the scenes to do all of the heavy lifting. In fact, `atom-typescript` will use the exact version of Typescript you have installed in your `node_modules` directory.

## Format Code
Shortcut : `ctrl+alt+l` or `cmd+alt+l`. Will format just the selection if you have something selected otherwise it will format the entire file.

## Go to Declaration
Shortcut : `F12`. Will open the *first* declaration of the said item for now. (Note: some people call it Go to Definition)

## Find References
Shortcut `shift+F12`. Also called *find usages*.

## Refactoring

### Rename
`f2` to initiate rename. `enter` to commit and `esc` to cancel.
![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/docs/screens/renameRefactoring.png)

## Quick Fix
Current iteration of the plugin doesn't support any Quickfixes, but they're coming in the future.

## Contributing

Look at [CONTRIBUTING.md](https://github.com/TypeStrong/atom-typescript/blob/master/CONTRIBUTING.md) for curiosity. We work hard to keep the code as approachable as possible and are highly keen on helping you help us.

## Changelog
Breaking changes [available online](https://github.com/TypeStrong/atom-typescript/blob/master/docs/CHANGELOG.md).
