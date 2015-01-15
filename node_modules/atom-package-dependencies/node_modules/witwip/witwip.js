var path = require('path'),
    fs = require('fs'),
    exists = fs.exists || path.exists,
    existsSync = fs.existsSync || path.existsSync,
    debug = require('debug')('witwip'),
    readJSON = require('read-package-json'),
    modulePathCache = {};

readJSON.log = {
  info: function() {},
  verbose: function() {},
  warn: function() {}
};

module.exports = witwip;

function witwip(base, modulePath, callback) {
  // If only a callback is passed, then find the package.json of the caller.
  if (typeof base === 'function') {
    callback = base;
    modulePath = null;
    base = module.parent;
  }

  // Allow base to be a module object (such as `module.parent`).
  if (base.filename) {
    base = path.dirname(base.filename);
  }

  if (typeof modulePath === 'function') {
    callback = modulePath;
    modulePath = null;
  }

  // If no modulePath is passed, check the base directory.
  modulePath = modulePath || '.';

  // Fetch from cache or initialize cache.
  if (!modulePathCache.hasOwnProperty(base)) {
    modulePathCache[base] = {};
  }
  var cache = modulePathCache[base];
  if (cache.hasOwnProperty(modulePath)) {
    debug('Found `' + modulePath + '` in `' + base + '` cache');
    return callback(null, cache[modulePath].path, cache[modulePath].data);
  }

  // Find closest package.json to the base.
  if (modulePath === '.') {
    find(base, function(err, pkgPath, pkgData) {
      if (err) return callback(err);
      cache[modulePath] = {path: pkgPath, data: pkgData};
      callback(null, pkgPath, pkgData);
    });
  }
  // Check a relative path for a package.json.
  else if (modulePath[0] === '.' || modulePath[0] === '/') {
    var check = path.resolve(base, modulePath, 'package.json');
    debug('Trying to resolve `' + check + '`');
    readJSON(check, function(err, data) {
      if (err) return callback(err);
      cache[modulePath] = {path: check, data: data};
      callback(null, check, data);
    });
  }
  // Recurse backwards through node_modules looking for the module.
  else {
    find(base, modulePath, function(err, pkgPath, pkgData) {
      if (err) return callback(err);
      cache[modulePath] = {path: pkgPath, data: pkgData};
      callback(null, pkgPath, pkgData);
    });
  }
}

// Returns the directory containing package.json instead of the filename.
witwip.dir = function(base, modulePath, callback) {
  witwip(base, modulePath, function(err, pkgPath, pkgData) {
    if (err) return callback(err);
    callback(null, path.dirname(pkgPath), pkgData);
  });
};

// Recursively search back up a directory tree for the neareset package.json or
// a module.
function find(basePath, modulePath, cb) {
  var check;
  if (typeof modulePath === 'function') {
    cb = modulePath;
    modulePath = null;
  }
  if (!basePath) {
    var err = new Error("Can't find '" + modulePath + "'");
    err.code = 'ENOENT';
    return cb(err);
  }
  if (modulePath)
    check = path.resolve(basePath, 'node_modules', modulePath, 'package.json');
  else
    check = path.resolve(basePath, 'package.json');

  debug('Trying to resolve `' + check + '`');
  readJSON(check, function(err, data) {
    if (err) {
      if (err.code && err.code === 'ENOENT') {
        return find(basePath.substr(0, basePath.lastIndexOf(path.sep)), modulePath, cb);
      }
      else {
        return cb(err);
      }
    }
    else {
      cb(null, check, data);
    }
  });
}
