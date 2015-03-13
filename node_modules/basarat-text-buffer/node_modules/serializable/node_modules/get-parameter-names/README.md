get-parameter-names
===================

Retrieves the argument names of a function

## Install

    npm install get-parameter-names

## Usage

    function foo(bar, baz) {
      return bar + baz
    }

    var get = require('get-parameter-names')
    get(foo) // = ['bar', 'baz']


## Tests

    npm test

## License

[MIT](http://josh.mit-license.org)
