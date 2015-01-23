"use strict";

var
  View = require('space-pen').View,
  inherits = require('./utils').inherits;

var MessagePanelView = function (params) {
  this.title = params.title;
  this.rawTitle = params.rawTitle || false;
  this.speed = params.speed || 'fast';
  this.panel = undefined;
  this.closeMethod = params.closeMethod || 'hide';
  this.messages = [];

  View.apply(this, arguments);
};

inherits(MessagePanelView, View);

MessagePanelView.content = function () {
  this.div({
    class: 'am-panel tool-panel panel-bottom native-key-bindings',
    tabindex: '-1'
  }, function () {
    this.div({
      class: 'panel-heading'
    }, function () {
      this.div({
        class: 'heading-title inline-block',
        outlet: 'heading'
      });
      this.div({
        class: 'heading-summary inline-block',
        outlet: 'summary'
      });
      this.div({
        class: 'heading-buttoms inline-block pull-right'
      }, function () {
        this.div({
          class: 'heading-fold inline-block icon-fold',
          style: 'cursor: pointer',
          outlet: 'btnFold',
          click: 'toggle'
        });
        this.div({
          class: 'heading-close inline-block icon-x',
          style: 'cursor: pointer;',
          outlet: 'btnClose',
          click: 'close'
        });
      }.bind(this));
    }.bind(this));
    this.div({
      class: 'panel-body padded',
      outlet: 'body',
      style: 'max-height: 170px; overflow-y: scroll;'
    });
  }.bind(this));
};

MessagePanelView.prototype.attach = function () {
  if (this.panel === undefined) {
    this.panel = atom.workspace.addBottomPanel({item: this});
  } else {
    this.panel.show();
  }
};

MessagePanelView.prototype.close = function () {
  if (this.panel !== undefined) {
    this.panel[this.closeMethod].call(this.panel);
    if (this.closeMethod === 'destroy') {
      this.panel = undefined;
    }
  }
};

MessagePanelView.prototype.initialize = function () {
  this.setTitle(this.title, this.rawTitle);
  this.summary.hide();
};

MessagePanelView.prototype.setTitle = function (title, raw) {
  if (raw) {
    this.heading.html(title);
  } else {
    this.heading.text(title);
  }
};

MessagePanelView.prototype.setSummary = function (summary) {
  var
    message = summary.summary,
    className = summary.className,
    raw = summary.rawSummary || false,
    handler = summary.handler || undefined;
  // Reset the class-attributes on the old summary
  this.summary.attr('class', 'heading-summary inline-block');
  // Set the new summary
  if (raw) {
    this.summary.html(message);
  } else {
    this.summary.text(message);
  }
  if (className) {
    this.summary.addClass(className);
  }
  if (handler) {
    handler(this.summary);
  }
};

MessagePanelView.prototype.toggle = function () {
  this.btnFold.toggleClass('icon-fold, icon-unfold');
  this.body.toggle(this.speed);
  // Because we want to toggle between display:
  // 'none' and 'inline-block' for the summary,
  // we can't use .toggle().
  if (this.summary.css('display') === 'none') {
    this.summary.css('display', 'inline-block');
  } else {
    this.summary.hide();
  }
};

MessagePanelView.prototype.clear = function () {
  this.messages = [];
  this.body.empty();
};

MessagePanelView.prototype.add = function (view) {
  if (this.messages.length === 0 && view.getSummary) {
    // This is the first message, so use it to
    // set the summary
    this.setSummary(view.getSummary());
  }
  this.messages.push(view);
  this.body.append(view);
};

module.exports = MessagePanelView;
