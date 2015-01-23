(function() {
  var Deprecation, SourceMapCache, convertLine, _;

  _ = require('underscore-plus');

  convertLine = require('coffeestack').convertLine;

  SourceMapCache = {};

  module.exports = Deprecation = (function() {
    Deprecation.getFunctionNameFromCallsite = function(callsite) {};

    function Deprecation(message) {
      this.message = message;
      this.callCount = 0;
      this.stacks = {};
      this.stackCallCounts = {};
    }

    Deprecation.prototype.getFunctionNameFromCallsite = function(callsite) {
      var _ref, _ref1, _ref2;
      if (callsite.isToplevel()) {
        return (_ref = callsite.getFunctionName()) != null ? _ref : '<unknown>';
      } else {
        if (callsite.isConstructor()) {
          return "new " + (callsite.getFunctionName());
        } else if (callsite.getMethodName() && !callsite.getFunctionName()) {
          return callsite.getMethodName();
        } else {
          return "" + (callsite.getTypeName()) + "." + ((_ref1 = (_ref2 = callsite.getMethodName()) != null ? _ref2 : callsite.getFunctionName()) != null ? _ref1 : '<anonymous>');
        }
      }
    };

    Deprecation.prototype.getLocationFromCallsite = function(callsite) {
      var column, converted, fileName, line;
      if (callsite.isNative()) {
        return "native";
      } else if (callsite.isEval()) {
        return "eval at " + (this.getLocationFromCallsite(callsite.getEvalOrigin()));
      } else {
        fileName = callsite.getFileName();
        line = callsite.getLineNumber();
        column = callsite.getColumnNumber();
        if (/\.coffee$/.test(fileName)) {
          if (converted = convertLine(fileName, line, column, SourceMapCache)) {
            line = converted.line, column = converted.column;
          }
        }
        return "" + fileName + ":" + line + ":" + column;
      }
    };

    Deprecation.prototype.getOriginName = function() {
      return this.originName;
    };

    Deprecation.prototype.getMessage = function() {
      return this.message;
    };

    Deprecation.prototype.getStacks = function() {
      var location, parsedStack, parsedStacks, stack, _ref;
      parsedStacks = [];
      _ref = this.stacks;
      for (location in _ref) {
        stack = _ref[location];
        parsedStack = this.parseStack(stack);
        parsedStack.callCount = this.stackCallCounts[location];
        parsedStack.metadata = stack.metadata;
        parsedStacks.push(parsedStack);
      }
      return parsedStacks;
    };

    Deprecation.prototype.getCallCount = function() {
      return this.callCount;
    };

    Deprecation.prototype.addStack = function(stack, metadata) {
      var callerLocation, _base, _base1;
      if (this.originName == null) {
        this.originName = this.getFunctionNameFromCallsite(stack[0]);
      }
      this.callCount++;
      stack.metadata = metadata;
      callerLocation = this.getLocationFromCallsite(stack[1]);
      if ((_base = this.stacks)[callerLocation] == null) {
        _base[callerLocation] = stack;
      }
      if ((_base1 = this.stackCallCounts)[callerLocation] == null) {
        _base1[callerLocation] = 0;
      }
      return this.stackCallCounts[callerLocation]++;
    };

    Deprecation.prototype.parseStack = function(stack) {
      return stack.map((function(_this) {
        return function(callsite) {
          return {
            functionName: _this.getFunctionNameFromCallsite(callsite),
            location: _this.getLocationFromCallsite(callsite),
            fileName: callsite.getFileName()
          };
        };
      })(this));
    };

    return Deprecation;

  })();

}).call(this);
