# es-symbol

> A spec-compliant as much as it could be, small, and tested ES6 Symbol implementation.

[![NPM version](https://badge.fury.io/js/es-symbol.svg)](http://badge.fury.io/js/es-symbol)
[![Build Status](https://secure.travis-ci.org/goatslacker/es-symbol.svg)](http://travis-ci.org/goatslacker/es-symbol)
[![Coverage Status](https://img.shields.io/coveralls/goatslacker/es-symbol.svg?style=flat)](https://coveralls.io/r/goatslacker/es-symbol)
[![Dependency Status](https://david-dm.org/goatslacker/es-symbol.svg)](https://david-dm.org/goatslacker/es-symbol)

* No unnecessary dependencies
* Works in node + browser (IE8--Modern browsers)
* Uses native `Symbol` if possible otherwise exports a polyfill

## Usage

```sh
npm install es-symbol
```

```js
var Symbol = require('es-symbol')

var sym = Symbol('foo')

var obj = {}
obj[sym] = 'hello'

// The following are true
obj.foo === undefined
obj[sym] === 'hello'
```

Disclaimer: This depends on ES5. If you need to support legacy browsers consider using an ES5 shim.

## More information

[Symbol Spec](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-symbol-constructor)

[Symbols in ECMAScript 6](http://www.2ality.com/2014/12/es6-symbols.html)

## License

[![MIT](https://img.shields.io/npm/l/alt.svg?style=flat)](http://josh.mit-license.org)
