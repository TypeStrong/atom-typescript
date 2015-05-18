(function() {
  var Deprecation, Emitter, grim;

  Emitter = require('emissary').Emitter;

  Deprecation = require('./deprecation');

  if (global.__grim__ == null) {
    grim = global.__grim__ = {
      deprecations: {},
      includeDeprecatedAPIs: true,
      getDeprecations: function() {
        var deprecation, deprecations, deprecationsByLineNumber, deprecationsByPackage, fileName, lineNumber, packageName, _ref;
        deprecations = [];
        _ref = grim.deprecations;
        for (fileName in _ref) {
          deprecationsByLineNumber = _ref[fileName];
          for (lineNumber in deprecationsByLineNumber) {
            deprecationsByPackage = deprecationsByLineNumber[lineNumber];
            for (packageName in deprecationsByPackage) {
              deprecation = deprecationsByPackage[packageName];
              deprecations.push(deprecation);
            }
          }
        }
        return deprecations;
      },
      getDeprecationsLength: function() {
        return this.getDeprecations().length;
      },
      clearDeprecations: function() {
        grim.deprecations = {};
      },
      logDeprecations: function() {
        var deprecation, deprecations, _i, _len;
        deprecations = this.getDeprecations();
        deprecations.sort(function(a, b) {
          return b.getCallCount() - a.getCallCount();
        });
        console.warn("\nCalls to deprecated functions\n-----------------------------");
        for (_i = 0, _len = deprecations.length; _i < _len; _i++) {
          deprecation = deprecations[_i];
          console.warn("(" + (deprecation.getCallCount()) + ") " + (deprecation.getOriginName()) + " : " + (deprecation.getMessage()), deprecation);
        }
      },
      deprecate: function(message, metadata) {
        var deprecation, deprecationSite, error, fileName, lineNumber, originalPrepareStackTrace, originalStackTraceLimit, packageName, stack, _base, _base1, _base2, _ref;
        originalStackTraceLimit = Error.stackTraceLimit;
        Error.stackTraceLimit = 7;
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
        packageName = (_ref = metadata != null ? metadata.packageName : void 0) != null ? _ref : "";
        if ((_base = grim.deprecations)[fileName] == null) {
          _base[fileName] = {};
        }
        if ((_base1 = grim.deprecations[fileName])[lineNumber] == null) {
          _base1[lineNumber] = {};
        }
        if ((_base2 = grim.deprecations[fileName][lineNumber])[packageName] == null) {
          _base2[packageName] = new Deprecation(message);
        }
        deprecation = grim.deprecations[fileName][lineNumber][packageName];
        deprecation.addStack(stack, metadata);
        grim.emit("updated", deprecation);
      },
      addSerializedDeprecation: function(serializedDeprecation) {
        var deprecation, fileName, lineNumber, message, packageName, stack, stacks, _base, _base1, _base2, _i, _len, _ref, _ref1, _ref2;
        deprecation = Deprecation.deserialize(serializedDeprecation);
        message = deprecation.getMessage();
        fileName = deprecation.fileName, lineNumber = deprecation.lineNumber;
        stacks = deprecation.getStacks();
        packageName = (_ref = (_ref1 = stacks[0]) != null ? (_ref2 = _ref1.metadata) != null ? _ref2.packageName : void 0 : void 0) != null ? _ref : "";
        if ((_base = grim.deprecations)[fileName] == null) {
          _base[fileName] = {};
        }
        if ((_base1 = grim.deprecations[fileName])[lineNumber] == null) {
          _base1[lineNumber] = {};
        }
        if ((_base2 = grim.deprecations[fileName][lineNumber])[packageName] == null) {
          _base2[packageName] = new Deprecation(message, fileName, lineNumber);
        }
        deprecation = grim.deprecations[fileName][lineNumber][packageName];
        for (_i = 0, _len = stacks.length; _i < _len; _i++) {
          stack = stacks[_i];
          deprecation.addStack(stack, stack.metadata);
        }
        grim.emit("updated", deprecation);
      }
    };
    Emitter.extend(grim);
  }

  module.exports = global.__grim__;

}).call(this);
