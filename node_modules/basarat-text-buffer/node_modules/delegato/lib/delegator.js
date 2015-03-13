(function() {
  var Delegator, Mixin, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Mixin = require('mixto');

  module.exports = Delegator = (function(_super) {
    __extends(Delegator, _super);

    function Delegator() {
      _ref = Delegator.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Delegator.delegatesProperties = function() {
      var propertyName, propertyNames, toMethod, toProperty, _arg, _i, _j, _len, _results,
        _this = this;
      propertyNames = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), _arg = arguments[_i++];
      toProperty = _arg.toProperty, toMethod = _arg.toMethod;
      _results = [];
      for (_j = 0, _len = propertyNames.length; _j < _len; _j++) {
        propertyName = propertyNames[_j];
        _results.push((function(propertyName) {
          return Object.defineProperty(_this.prototype, propertyName, (function() {
            if (toProperty != null) {
              return {
                get: function() {
                  return this[toProperty][propertyName];
                },
                set: function(value) {
                  return this[toProperty][propertyName] = value;
                }
              };
            } else if (toMethod != null) {
              return {
                get: function() {
                  return this[toMethod]()[propertyName];
                },
                set: function(value) {
                  return this[toMethod]()[propertyName] = value;
                }
              };
            } else {
              throw new Error("No delegation target specified");
            }
          })());
        })(propertyName));
      }
      return _results;
    };

    Delegator.delegatesMethods = function() {
      var methodName, methodNames, toMethod, toProperty, _arg, _i, _j, _len, _results,
        _this = this;
      methodNames = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), _arg = arguments[_i++];
      toProperty = _arg.toProperty, toMethod = _arg.toMethod;
      _results = [];
      for (_j = 0, _len = methodNames.length; _j < _len; _j++) {
        methodName = methodNames[_j];
        _results.push((function(methodName) {
          if (toProperty != null) {
            return _this.prototype[methodName] = function() {
              var args, _ref1;
              args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return (_ref1 = this[toProperty])[methodName].apply(_ref1, args);
            };
          } else if (toMethod != null) {
            return _this.prototype[methodName] = function() {
              var args, _ref1;
              args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return (_ref1 = this[toMethod]())[methodName].apply(_ref1, args);
            };
          } else {
            throw new Error("No delegation target specified");
          }
        })(methodName));
      }
      return _results;
    };

    Delegator.delegatesProperty = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this.delegatesProperties.apply(this, args);
    };

    Delegator.delegatesMethod = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this.delegatesMethods.apply(this, args);
    };

    return Delegator;

  })(Mixin);

}).call(this);
