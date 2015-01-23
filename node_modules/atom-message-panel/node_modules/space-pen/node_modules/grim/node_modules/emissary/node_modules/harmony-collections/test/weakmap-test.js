var tap = require('tap');
var test = tap.test;
var WM;
var map;
var memoryReading = require('./memory-reading');
var secrets = ['secrets'];

var methods = ['get', 'set', 'has', 'delete'];

test('load', function(t){
  t.ok(WM = require('../').WeakMap, 'WeakMap loaded');
  t.similar(Object.getOwnPropertyNames(WM.prototype).sort(), [
    'constructor','delete','get', 'has','set','toString'
  ], 'has all expected prototype properties');
  t.same(WM.name, 'WeakMap', 'check name');
  t.same(WM+'', 'function WeakMap() { [native code] }', 'check toString');
  t.same(WM.prototype+'', '[object WeakMap]', 'check brand');

  t.end();
});


test('basic usage', function(t){
  t.ok(map = new WM, 'create instance');
  t.same(Object.getPrototypeOf(map), WM.prototype, 'instance of WeakMap.prototype');
  t.similar(Object.getOwnPropertyNames(map), [], 'no observable properties on the instance');
  t.same(map.get(WM), undefined, 'retreiving non-existant key returns undefined');
  t.same(map.set(WM, secrets), undefined, 'set works and returns undefined');
  t.same(map.get(WM), secrets, 'retreiving works');
  t.same(map.set(WM, 'overwrite'), undefined, 'primitive value set works');
  t.same(map.get(WM), 'overwrite', 'overwriting works');
  t.same(map.has(WM), true, 'has returns true');
  t.same(map.delete(WM), true, 'delete returns true');
  t.same(map.has(WM), false, 'has returns false');
  t.same(map.get(WM), undefined, 'retreiving deleted item returns undefined');
  t.end();
});

test('errors', function(t){
  methods.forEach(function(method){
    t.throws(function(){ map[method]('string', secrets) }, 'primitive key in '+method+' throws');
    t.throws(function(){ map[method].call({}, {}) }, 'using '+method+' on a non-weakmap throws');
  });
  t.end();
});


test('garbage collection', function(t){
  var create = memoryReading('create');
  for (var i=0; i < 1000; i++) {
    var x = new WM;
    x.set({}, {});
  }
  console.log(memoryReading('create'));
  setTimeout(function(){
    console.log(create.compare(memoryReading('create')));
  }, 100);
  t.end();
});
