See the [Atom contributing guide](https://atom.io/docs/latest/contributing)

# Tasks
## Building 
`grunt build`

## Developing
`grunt`

## Publishing
`apm publish`


# General research
## Getting the language service
Opening up the TypeScript compiler : https://github.com/basarat/typescript-services#contributing

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
An example : https://github.com/AtomLinter/linter-tslint/blob/master/lib/linter-tslint.coffee 

Inherit, override `lintFile` and call the passed `callback` with an array of messages each of form: 

```js
      line: match.line,
      col: match.col,
      level: level,  // 'error', 'warning'
      message: match.message,
      linter: "TypeScript"
```

