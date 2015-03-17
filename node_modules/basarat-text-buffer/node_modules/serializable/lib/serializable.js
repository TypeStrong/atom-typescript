(function() {
  var Mixin, Serializable, extend, getParameterNames, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  extend = require('underscore-plus').extend;

  Mixin = require('mixto');

  getParameterNames = require('get-parameter-names');

  module.exports = Serializable = (function(_super) {
    __extends(Serializable, _super);

    function Serializable() {
      _ref = Serializable.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Serializable.prototype.deserializers = null;

    Serializable.registerDeserializers = function() {
      var deserializer, deserializers, _i, _len, _results;
      deserializers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = deserializers.length; _i < _len; _i++) {
        deserializer = deserializers[_i];
        _results.push(this.registerDeserializer(deserializer));
      }
      return _results;
    };

    Serializable.registerDeserializer = function(deserializer) {
      if (this.deserializers == null) {
        this.deserializers = {};
      }
      return this.deserializers[deserializer.name] = deserializer;
    };

    Serializable.deserialize = function(state, params) {
      var deserializer, object, orderedParams, _ref1;
      if (state == null) {
        return;
      }
      if (state.deserializer === this.name) {
        deserializer = this;
      } else {
        deserializer = (_ref1 = this.deserializers) != null ? _ref1[state.deserializer] : void 0;
      }
      if (!((deserializer != null) && deserializer.version === state.version)) {
        return;
      }
      object = Object.create(deserializer.prototype);
      params = extend({}, state, params);
      delete params.deserializer;
      if (typeof object.deserializeParams === 'function') {
        params = object.deserializeParams(params);
      }
      if (params == null) {
        return;
      }
      if (deserializer.parameterNames == null) {
        deserializer.parameterNames = getParameterNames(deserializer);
      }
      if (deserializer.parameterNames.length > 1 || params.hasOwnProperty(deserializer.parameterNames[0])) {
        orderedParams = deserializer.parameterNames.map(function(name) {
          return params[name];
        });
        deserializer.call.apply(deserializer, [object].concat(__slice.call(orderedParams)));
      } else {
        deserializer.call(object, params);
      }
      return object;
    };

    Serializable.prototype.serialize = function() {
      var state, _ref1;
      state = (_ref1 = typeof this.serializeParams === "function" ? this.serializeParams() : void 0) != null ? _ref1 : {};
      state.deserializer = this.constructor.name;
      if (this.constructor.version != null) {
        state.version = this.constructor.version;
      }
      return state;
    };

    Serializable.prototype.testSerialization = function(params) {
      return this.constructor.deserialize(this.serialize(), params);
    };

    return Serializable;

  })(Mixin);

}).call(this);
