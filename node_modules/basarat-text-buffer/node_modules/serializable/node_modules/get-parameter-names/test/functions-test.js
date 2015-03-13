function /* (no parenthesis like this) */ test1(a, b, c){
  return true
}

function test2(a, b, c) /*(why do people do this??)*/{
  return true
}

function test3(a, /* (jewiofewjf,wo, ewoi, werp)*/ b, c) {
  return true
}

function test4(a/* a*/, /* b */b, /*c*/c,d/*d*/) {
  return function (one, two, three) {
  }
}

function test5(
  a,
  b,
  c
) {
  return false;
}

function test6(a) { return function f6(a, b) { } }

function test7(
  /*
   function test5(
     a,
     b,
     c
   ) {
     return false;
   }
   function test5(
     a,
     b,
     c
   ) {
     return false;
   }
   function test5(
     a,
     b,
     c
   ) {
     return false;
   }
   */
  a,b,c) { return true }

function                                               test8
                             (a,b,c){}

function π9(ƒ, µ) { (a + 2 + b + 2 + c) }

module.exports = {
  'test1': function (arg, assert) {
    assert.deepEqual(
      arg(test1),
      ['a', 'b', 'c']
    )
  },

  'test2': function (arg, assert) {
    assert.deepEqual(
      arg(test2),
      ['a', 'b', 'c']
    )
  },

  'test3': function (arg, assert) {
    assert.deepEqual(
      arg(test3),
      ['a', 'b', 'c']
    )
  },

  'test4': function (arg, assert) {
    assert.deepEqual(
      arg(test4),
      ['a', 'b', 'c', 'd']
    )
  },

  'test5': function (arg, assert) {
    assert.deepEqual(
      arg(test5),
      ['a', 'b', 'c']
    )
  },

  'test6': function (arg, assert) {
    assert.deepEqual(
      arg(test6),
      ['a']
    )
  },

  'test7': function (arg, assert) {
    assert.deepEqual(
      arg(test7),
      ['a', 'b', 'c']
    )
  },

  'test8': function (arg, assert) {
    assert.deepEqual(
      arg(test8),
      ['a', 'b', 'c']
    )
  },

  'test9': function (arg, assert) {
    assert.deepEqual(
      arg(π9),
      ['ƒ', 'µ']
    )
  }
}
