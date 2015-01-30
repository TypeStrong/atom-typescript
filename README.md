# TypeScript workflow from Atom
 
Final Objective: Make it easy for JavaScript developers to just open a `.ts` file and start hacking away like they are used to.

# Features
## Auto Complete
Internally using AutoComplete+. Just start typing and hints will show up.

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/autocomplete1.png)

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/autocomplete2.png)

You can explicitly trigger it using `ctrl+shift+space` or `cmd+shift+space`.

## Type information on hover
Just hover

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/hover.png)

## Compile on save
TypeScript files will be compiled on save. Different notifications are given if `emit` was successful or not.

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/compile%20success.png)

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/compile%20error.png)

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/emit%20error.png)

## Project Support
Supported via `tsconfig.json` which is going to be the defacto Project file format for the next versions of TypeScript.

It also supports `filesGlob` which will expand `files` for you based on `minmatch|glob|regex` (similar to grunt).

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/proj.png)

### Project Build Support
Build Shortcut: `ctrl+shift+b` or `cmd+shift+b`

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/build.png)

## Format Code
Shortcut : `ctrl+alt+l` or `cmd+alt+l`. Will format just the selection if you have something selected otherwise it will format the entire file.

## Contributing 

Look at [CONTRIBUTING.md](https://github.com/TypeStrong/atom-typescript/blob/master/CONTRIBUTING.md) for curiosity.

# Previous Work
* The TypeScript language package : https://github.com/olegbl/language-typescript
* TypeScript brackets support : https://github.com/fdecampredon/brackets-typescript

