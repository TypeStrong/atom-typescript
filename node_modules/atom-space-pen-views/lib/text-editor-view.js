(function() {
  var $, TextEditorView, View, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('space-pen'), View = _ref.View, $ = _ref.$;

  module.exports = TextEditorView = (function(_super) {
    __extends(TextEditorView, _super);

    function TextEditorView(params) {
      var attributes, mini, name, placeholderText, value;
      if (params == null) {
        params = {};
      }
      mini = params.mini, placeholderText = params.placeholderText, attributes = params.attributes;
      if (attributes == null) {
        attributes = {};
      }
      if (mini != null) {
        attributes['mini'] = mini;
      }
      if (placeholderText != null) {
        attributes['placeholder-text'] = placeholderText;
      }
      this.element = document.createElement('atom-text-editor');
      for (name in attributes) {
        value = attributes[name];
        this.element.setAttribute(name, value);
      }
      if (this.element.__spacePenView != null) {
        this.element.__spacePenView = this;
        this.element.__allowViewAccess = true;
      }
      TextEditorView.__super__.constructor.apply(this, arguments);
      this.setModel(this.element.getModel());
    }

    TextEditorView.prototype.setModel = function(model) {
      this.model = model;
    };

    TextEditorView.prototype.getModel = function() {
      return this.model;
    };

    TextEditorView.prototype.getText = function() {
      return this.model.getText();
    };

    TextEditorView.prototype.setText = function(text) {
      return this.model.setText(text);
    };

    TextEditorView.prototype.hasFocus = function() {
      return this.element.hasFocus();
    };

    return TextEditorView;

  })(View);

}).call(this);
