(function() {
  var ScrollView, View,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('space-pen').View;

  module.exports = ScrollView = (function(_super) {
    __extends(ScrollView, _super);

    function ScrollView() {
      return ScrollView.__super__.constructor.apply(this, arguments);
    }

    ScrollView.prototype.initialize = function() {
      return atom.commands.add(this.element, {
        'core:move-up': (function(_this) {
          return function() {
            return _this.scrollUp();
          };
        })(this),
        'core:move-down': (function(_this) {
          return function() {
            return _this.scrollDown();
          };
        })(this),
        'core:page-up': (function(_this) {
          return function() {
            return _this.pageUp();
          };
        })(this),
        'core:page-down': (function(_this) {
          return function() {
            return _this.pageDown();
          };
        })(this),
        'core:move-to-top': (function(_this) {
          return function() {
            return _this.scrollToTop();
          };
        })(this),
        'core:move-to-bottom': (function(_this) {
          return function() {
            return _this.scrollToBottom();
          };
        })(this)
      });
    };

    return ScrollView;

  })(View);

}).call(this);
