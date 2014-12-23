var witwip = require('../'),
    path = require('path'),
    assert = require('assert');

describe('basic functionality', function() {

  it('can find package.json of the current module', function(done) {
    witwip(function(err, pkgPath, info) {
      assert.ifError(err);
      assert.equal(info.name, 'basic');
      done();
    });
  });

  it('can find package.json of a base module', function(done) {
    witwip(module, function(err, pkgPath, info) {
      assert.ifError(err);
      assert.equal(info.name, 'basic');
      done();
    });
  });

  it('can find package.json of local module', function(done) {
    witwip(module, './local/chief', function(err, pkgPath, info) {
      assert.ifError(err);
      assert.equal(info.name, 'chief');
      done();
    });
  });

  it('can find a module that uses a package comment', function(done) {
    witwip(module, './local/carmen', function(err, pkgPath, info) {
      assert.ifError(err);
      assert.equal(info.name, 'carmen');
      done();
    });
  });

  it('can find package.json recursing out of a sub-folder', function(done) {
    witwip(__dirname + '/local/chief/subfolder/deeper', function(err, pkgPath, info) {
      assert.ifError(err);
      assert.equal(info.name, 'chief');
      done();
    });
  });

  it('can find package.json of a module', function(done) {
    witwip(module, 'debug', function(err, pkgPath, info) {
      assert.ifError(err);
      assert.equal(info.name, 'debug');
      done();
    });
  });

  it('errors when a match cannot be found', function(done) {
    witwip(__dirname, './local/nothere', function(err, pkgPath, info) {
      assert.equal(err.code, 'ENOENT');
      done();
    });
  });

  it('can return the directory instead of the file path', function(done) {
    witwip.dir(module, 'debug', function(err, pkgDir, info) {
      assert.ifError(err);
      assert.equal(pkgDir, path.resolve(__dirname, '..', 'node_modules/debug'));
      done();
    });
  });

});