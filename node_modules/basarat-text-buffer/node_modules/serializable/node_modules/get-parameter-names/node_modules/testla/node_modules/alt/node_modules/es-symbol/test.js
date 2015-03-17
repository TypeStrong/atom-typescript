var assert = require('assert')

// disable global Symbol so we can test the polyfill
delete global.Symbol

var Symbol = require('./')

function t(x) {
  assert.equal(true, tests[x](), x)
}

var tests = {
  'basic functionality'() {
    var object = {}
    var symbol = Symbol()
    var value = {}
    object[symbol] = value
    return object[symbol] === value
  },

  'symbol keys are somewhat hidden to pre-ES6 code'() {
    var object = {}
    var symbol = Symbol()
    object[symbol] = 1

    for (var x in object){}
    var passed = (x !== symbol)

    return passed &= Object.keys(object).length === 0
  },

  'symbol keys are not really hidden to pre-ES6 code'() {
    var object = {}
    var symbol = Symbol()
    object[symbol] = 1

    if (typeof symbol !== 'symbol') {
      return Object.getOwnPropertyNames(object).length === 1
    } else {
      return Object.getOwnPropertyNames(object).length === 0
    }
  },

  'Object.defineProperty support'() {
    var object = {}
    var symbol = Symbol()
    var value = {}

    Object.defineProperty(object, symbol, { value: value })
    return object[symbol] === value
  },

  'can convert with String()'() {
    var sym = String(Symbol('bananas'))
    return sym === 'Symbol(bananas)'
  },

  'new Symbol() throws'() {
    var symbol = Symbol()
    try {
      new Symbol()
    } catch(e) {
      return true
    }
  },

  'global symbol registry'() {
    var symbol = Symbol.for('foo')
    return Symbol.for('foo') === symbol &&
       Symbol.keyFor(symbol) === 'foo'
  },

  'for and keyFor work as expected'() {
    var a = Symbol('foo')
    var b = Symbol('foo')

    var c = Symbol.for('foo')

    var d = Symbol.keyFor(a)
    var e = Symbol.keyFor(c)

    return (
      // two symbols with same key are not equal to each other
      a !== b &&
      // symbol.for does not produce either symbol because they were not added
      // to registry list
      b !== c &&
      // since they aren't on registry list, keyFor is undefined.
      d === undefined &&
      // but keyFor works on symbols created using Symbol.for
      e === 'foo'
    )
  },

  'symbol length'() {
    return Symbol.length === 1
  },

  'symbols are ignored by stringify'() {
    var a = Symbol('ignore me')
    var b = {}
    b[a] = true

    var x = JSON.stringify(b)

    return x === '{}'
  },

  'make sure keys are not enumerable'() {
    var obj = {}

    obj[Symbol('a')] = 'a'
    obj[Symbol.for('b')] = 'b'
    obj['c'] = 'c'
    obj.d = 'd'

    var foo = []

    for (var i in obj) {
      foo.push(i)
    }

    return foo.length === 2 && foo[0] === 'c' && foo[1] === 'd'
  },

  'can use Object()'() {
    var sym = Symbol('foo')
    var obj = {[sym]: 1}

    if (typeof sym === 'symbol') {
      return obj[sym] === 1
    } else {
      return obj[sym] === 1 && obj[Object(sym)] === 1
    }
  },

  'keys do not collide'() {
    var a = {}
    var x = Symbol('a')
    var y = Symbol('a')
    a[x] = 1
    a[y] = 2

    return a[x] === 1 && a[y] === 2
  },

  'you cant naively guess the keys'() {
    var a = {}
    var x = Symbol('a')
    a[x] = 1

    return a['a'] === undefined
  },

  'symbol is not an instance of itself'() {
    var x = Symbol()
    return !(x instanceof Symbol)
  },

  'broken use of keyFor'() {
    try {
      Symbol.keyFor('lol')
    } catch (e) {
      return e instanceof TypeError
    }
  },

  'you can rewrite symbols in instances'() {
    var priv = Symbol()

    function X() {
      this[priv] = true
    }

    var x = new X()

    var passed = x[priv] === true

    x[priv] = false

    return passed &= x[priv] === false
  }
}

// Things that can be polyfilled
t('basic functionality')
t('symbol keys are somewhat hidden to pre-ES6 code')
t('Object.defineProperty support')
t('new Symbol() throws')
t('global symbol registry')
t('can convert with String()')

// Other random tests
t('symbol keys are not really hidden to pre-ES6 code')
t('for and keyFor work as expected')
t('symbol length')
t('symbols are ignored by stringify')
t('make sure keys are not enumerable')
t('can use Object()')
t('keys do not collide')
t('you cant naively guess the keys')
t('symbol is not an instance of itself')
t('broken use of keyFor')
t('you can rewrite symbols in instances')
