"use strict";

var
  View = require('space-pen').View,
  inherits = require('./utils').inherits;

var PlainMessageView = function (params) {
  this.message = params.message;
  this.raw = params.raw || false;
  this.className = params.className || undefined;

  View.apply(this, arguments);
};

inherits(PlainMessageView, View);

PlainMessageView.content = function () {
  this.div({
    class: 'plain-message'
  });
};

PlainMessageView.prototype.initialize = function () {
  if (this.raw) {
    this.html(this.message);
  } else {
    this.text(this.message);
  }

  if (this.className) {
    this.addClass(this.className);
  }
};

PlainMessageView.prototype.getSummary = function () {
  return {
    summary: this.message,
    className: this.className,
    rawSummary: this.raw,
  };
};

module.exports = PlainMessageView;
