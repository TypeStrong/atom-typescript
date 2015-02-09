# Atom TypeScript

[![Join the chat at https://gitter.im/TypeStrong/atom-typescript](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/TypeStrong/atom-typescript?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

JavaScript developers can now just open a `.ts` file and start hacking away like they are used to. No `grunt` no `Visual Studio`. Just pure coding.

## Requirements
An auto updating version of `atom`. Other atom packages we depend upon are installed automatically.

1. Install Atom
1. `apm install typescript`

**Note**: For windows you also need `node` in your path ([reason](https://github.com/TypeStrong/atom-typescript/issues/50)).  
For dependencies to install correctly, you will also need `git` in your path.

## Reviews
"I was shocked at how good it felt to poke around on the compiler with it." [Jonathan Turner](https://twitter.com/jntrnr)
<br/>
"And guess what, it worked perfectly. Like everything else! Faster than Visual Studio!" [Daniel Earwicker](http://stackoverflow.com/users/27423/daniel-earwicker)
<br/>
[*Add yours!*](https://github.com/TypeStrong/atom-typescript/issues/66)

# Features
## Auto Complete
Internally using AutoComplete+. Just start typing and hints will show up. Or you can explicitly trigger it using `ctrl+space` or `cmd+space`. Press `tab` to make a selection.

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/autocomplete1.png)

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/autocomplete2.png)


## Type information on hover
Just hover

![you definitely get the point](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/hover.png)

## Compile on save
TypeScript files will be compiled on save. Different notifications are given if `emit` was successful or not.

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/compile%20success.png)

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/compile%20error.png)

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/emit%20error.png)

## Project Support
Supported via `tsconfig.json` ([read more](https://github.com/TypeStrong/atom-typescript/blob/master/docs/tsconfig.md)) which is going to be the defacto Project file format for the next versions of TypeScript.

It also supports `filesGlob` which will expand `files` for you based on `minmatch|glob|regex` (similar to grunt).

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/proj.png)

### Project Build Support
Shortcut: `ctrl+shift+b` or `cmd+shift+b`. If there are any errors they are shown as well.

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/build%20success.png)

![](https://raw.githubusercontent.com/TypeStrong/atom-typescript/master/examples/screens/build%20errors.png)

## Format Code
Shortcut : `ctrl+alt+l` or `cmd+alt+l`. Will format just the selection if you have something selected otherwise it will format the entire file.

## Go to Declaration
Shortcut : `ctrl+b` or `cmd+b`. Will open the *first* declaration of the said item for now. (Note: some people call it Go to Definition)

## Contributing

Look at [CONTRIBUTING.md](https://github.com/TypeStrong/atom-typescript/blob/master/CONTRIBUTING.md) for curiosity.

## Changelog
Breaking changes [available online](https://github.com/TypeStrong/atom-typescript/blob/master/docs/CHANGELOG.md).

# Previous Work
* The TypeScript language package : https://github.com/olegbl/language-typescript
* TypeScript brackets support : https://github.com/fdecampredon/brackets-typescript
