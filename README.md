# Atom TypeScript

[![Join the chat at https://gitter.im/TypeStrong/atom-typescript](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/TypeStrong/atom-typescript?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

JavaScript developers can now just open a `.ts` file and start hacking away like they are used to. No `grunt` no `Visual Studio`. Just pure coding.

## Installation

1. Install [atom](https://atom.io).
2. `apm install atom-typescript` (`apm` needs `git` in your path)
3. Fire up atom. Wait for the message: `AtomTS: Dependencies installed correctly. Best you restart atom just this once ♥` **It may take up to 5 minutes for this message to appear. Be patient!**
4. Restart atom

**Additional Notes**: Other atom packages we depend upon are installed automatically on first load. [Learn more about these](https://github.com/TypeStrong/atom-typescript/blob/master/docs/packages.md). 

## Reviews
"I was shocked at how good it felt to poke around on the compiler with it." [Jonathan Turner](https://twitter.com/jntrnr)  
"And guess what, it worked perfectly. Like everything else! Faster than Visual Studio!" [Daniel Earwicker](http://stackoverflow.com/users/27423/daniel-earwicker)  
"It's a thing of beauty - they had me at '*Type information on hover*'. Discovering  `tsconfig.json` support as well was just an enormous bonus." [John Reilly](https://twitter.com/johnny_reilly)

[*Add yours!*](https://github.com/TypeStrong/atom-typescript/issues/66)

# Features
## Auto Complete
Internally using AutoComplete+. Just start typing and hints will show up. Or you can explicitly trigger it using `ctrl+space` or `cmd+space`. Press `tab` to make a selection.

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/docs/screens/autocomplete1.png)

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/docs/screens/autocomplete2.png)


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
Shortcut: `ctrl+shift+b` or `cmd+shift+b`. If there are any errors they are shown as well.

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/docs/screens/build%20success.png)

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/docs/screens/build%20errors.png)

## Format Code
Shortcut : `ctrl+alt+l` or `cmd+alt+l`. Will format just the selection if you have something selected otherwise it will format the entire file.

## Go to Declaration
Shortcut : `ctrl+b` or `cmd+b`. Will open the *first* declaration of the said item for now. (Note: some people call it Go to Definition)

## Block Comment and Uncomment
`ctrl+/` or `cmd+/`. Does a block comment / uncomment of code.

## Refactoring

### Rename
`f2` to initiate rename. `enter` to commit and `esc` to cancel.
![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/docs/screens/renameRefactoring.png)

## Snippets
### Relative Paths
Relative paths have traditionally been a pain, not anymore. Use `import` or `ref` and press `tab` to trigger snippet. 

`ref`
![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/ref%20snippet.gif)

`import`
![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/import%20snippet.gif)

Note that within the path string you get autocomplete (`ctrl+space`/`cmd+space`) for all the files in the project by filename (works for both `ref` and `import`).

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript-examples/master/screens/pathChange.gif)

## Contributing

Look at [CONTRIBUTING.md](https://github.com/TypeStrong/atom-typescript/blob/master/CONTRIBUTING.md) for curiosity. We work hard to keep the code as approachable as possible and are highly keep on helping you help us.

## Changelog
Breaking changes [available online](https://github.com/TypeStrong/atom-typescript/blob/master/docs/CHANGELOG.md).
