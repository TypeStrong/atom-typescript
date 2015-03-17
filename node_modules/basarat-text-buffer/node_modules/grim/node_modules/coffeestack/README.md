# CoffeeStack [![Build Status](https://travis-ci.org/kevinsawicki/coffeestack.png)](https://travis-ci.org/kevinsawicki/coffeestack)

Module to convert JavaScript stack traces to CoffeeScript stack traces.

## Installing

```sh
npm install coffeestack
```

## Using

```coffeescript
{convertStackTrace} = require 'coffeestack'

try
  throw new Error('this is an error')
catch error
  console.error(convertStackTrace(error.stack))
```
