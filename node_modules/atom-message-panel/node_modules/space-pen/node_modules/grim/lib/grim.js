(function() {
  var Deprecation, Emitter, grim, _;

  _ = require('underscore-plus');

  Emitter = require('emissary').Emitter;

  Deprecation = require('./deprecation');

  if (global.__grim__ == null) {
    grim = global.__grim__ = {
      deprecations: {},
      getDeprecations: function() {
        var deprecation, deprecations, deprecationsByLineNumber, fileName, lineNumber, _ref;
        deprecations = [];
        _ref = grim.deprecations;
        for (fileName in _ref) {
          deprecationsByLineNumber = _ref[fileName];
          for (lineNumber in deprecationsByLineNumber) {
            deprecation = deprecationsByLineNumber[lineNumber];
            deprecations.push(deprecation);
          }
        }
        return deprecations;
      },
      getDeprecationsLength: function() {
        return this.getDeprecations().length;
      },
      clearDeprecations: function() {
        return grim.deprecations = {};
      },
      logDeprecations: function() {
        var deprecation, deprecations, _i, _len, _results;
        deprecations = this.getDeprecations();
        deprecations.sort(function(a, b) {
          return b.getCallCount() - a.getCallCount();
        });
        console.warn("\nCalls to deprecated functions\n-----------------------------");
        _results = [];
        for (_i = 0, _len = deprecations.length; _i < _len; _i++) {
          deprecation = deprecations[_i];
          _results.push(console.warn("(" + (deprecation.getCallCount()) + ") " + (deprecation.getOriginName()) + " : " + (deprecation.getMessage()), deprecation));
        }
        return _results;
      },
      deprecate: function(message, metadata) {
        var deprecation, deprecationSite, error, fileName, lineNumber, originalPrepareStackTrace, originalStackTraceLimit, stack, _base, _base1;
        originalStackTraceLimit = Error.stackTraceLimit;
        Error.stackTraceLimit = 3;
        error = new Error;
        Error.captureStackTrace(error);
        Error.stackTraceLimit = originalStackTraceLimit;
        originalPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = function(error, stack) {
          return stack;
        };
        stack = error.stack.slice(1);
        Error.prepareStackTrace = originalPrepareStackTrace;
        deprecationSite = stack[0];
        fileName = deprecationSite.getFileName();
        lineNumber = deprecationSite.getLineNumber();
        if ((_base = grim.deprecations)[fileName] == null) {
          _base[fileName] = {};
        }
        if ((_base1 = grim.deprecations[fileName])[lineNumber] == null) {
          _base1[lineNumber] = new Deprecation(message);
        }
        deprecation = grim.deprecations[fileName][lineNumber];
        deprecation.addStack(stack, metadata);
        return grim.emit("updated", deprecation);
      }
    };
    Emitter.extend(grim);
  }

  module.exports = global.__grim__;

}).call(this);
