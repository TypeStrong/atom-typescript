(function() {
  var BufferPatch, Range, Serializable,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Serializable = require('serializable');

  Range = require('./range');

  module.exports = BufferPatch = (function(_super) {
    __extends(BufferPatch, _super);

    function BufferPatch(oldRange, newRange, oldText, newText, normalizeLineEndings, markerPatches) {
      this.oldRange = oldRange;
      this.newRange = newRange;
      this.oldText = oldText;
      this.newText = newText;
      this.normalizeLineEndings = normalizeLineEndings;
      this.markerPatches = markerPatches != null ? markerPatches : {};
    }

    BufferPatch.prototype.serializeParams = function() {
      var id, markerPatches, newRange, oldRange, patch, _i, _len, _ref;
      oldRange = this.oldRange.serialize();
      newRange = this.newRange.serialize();
      markerPatches = {};
      _ref = this.markerPatches;
      for (patch = _i = 0, _len = _ref.length; _i < _len; patch = ++_i) {
        id = _ref[patch];
        markerPatches[id] = patch.serialize();
      }
      return {
        oldRange: oldRange,
        newRange: newRange,
        oldText: this.oldText,
        newText: this.newText,
        normalizeLineEndings: this.normalizeLineEndings,
        markerPatches: markerPatches
      };
    };

    BufferPatch.prototype.deserializeParams = function(params) {
      var id, patchState, _i, _len, _ref;
      params.oldRange = Range.deserialize(params.oldRange);
      params.newRange = Range.deserialize(params.newRange);
      _ref = params.markerPatches;
      for (patchState = _i = 0, _len = _ref.length; _i < _len; patchState = ++_i) {
        id = _ref[patchState];
        params.markerPatches[id] = MarkerPatch.deserialize(patchState);
      }
      return params;
    };

    BufferPatch.prototype.invert = function(buffer) {
      var id, invertedPatch, marker, markerPatches, patch, _i, _len, _ref, _ref1;
      markerPatches = {};
      _ref = this.markerPatches;
      for (id in _ref) {
        patch = _ref[id];
        markerPatches[id] = patch.invert();
      }
      invertedPatch = new this.constructor(this.newRange, this.oldRange, this.newText, this.oldText, this.normalizeLineEndings, markerPatches);
      _ref1 = buffer.getMarkers();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        marker = _ref1[_i];
        if (this.markerPatches[marker.id] == null) {
          marker.handleBufferChange(invertedPatch);
        }
      }
      return invertedPatch;
    };

    BufferPatch.prototype.applyTo = function(buffer) {
      return buffer.applyPatch(this);
    };

    BufferPatch.prototype.addMarkerPatch = function(patch) {
      return this.markerPatches[patch.id] = patch;
    };

    return BufferPatch;

  })(Serializable);

}).call(this);
