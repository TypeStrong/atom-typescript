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

# General research
## Getting the language service
Opening up the TypeScript compiler : https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API

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

Potentially use the decorator API https://gist.github.com/steelbrain/036b107e38cf34daba03 
