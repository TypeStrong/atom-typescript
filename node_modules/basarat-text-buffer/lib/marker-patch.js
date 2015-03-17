(function() {
  var MarkerPatch, Range, Serializable, clone,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  clone = require('underscore-plus').clone;

  Serializable = require('serializable');

  Range = require('./range');

  module.exports = MarkerPatch = (function(_super) {
    __extends(MarkerPatch, _super);

    function MarkerPatch(id, oldParams, newParams) {
      this.id = id;
      this.oldParams = oldParams;
      this.newParams = newParams;
    }

    MarkerPatch.prototype.serializeParams = function() {
      var newParams, oldParams;
      oldParams = clone(this.oldParams);
      if (this.oldParams.range != null) {
        oldParams.range = this.oldParams.range.serialize();
      }
      newParams = clone(this.newParams);
      if (this.newParams.range != null) {
        newParams.range = this.newParams.range.serialize();
      }
      return {
        id: this.id,
        oldParams: oldParams,
        newParams: newParams
      };
    };

    MarkerPatch.prototype.deserializeParams = function(params) {
      params.oldParams.range = Range.deserialize(params.oldParams.range);
      params.newParams.range = Range.deserialize(params.newParams.range);
      return params;
    };

    MarkerPatch.prototype.invert = function() {
      return new this.constructor(this.id, this.newParams, this.oldParams);
    };

    MarkerPatch.prototype.applyTo = function(buffer) {
      var _ref;
      return (_ref = buffer.getMarker(this.id)) != null ? _ref.update(this.newParams) : void 0;
    };

    return MarkerPatch;

  })(Serializable);

}).call(this);
