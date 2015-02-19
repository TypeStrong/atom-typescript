"use strict";

var
  $ = require('space-pen').$,
  View = require('space-pen').View,
  inherits = require('./utils').inherits;

var MessagePanelView = function (params) {
  this.title = params.title;
  this.rawTitle = params.rawTitle || false;
  this.speed = params.speed || 'fast';
  this.panel = undefined;
  this.maxHeight = params.maxHeight || '170px';
  this.autoScroll = params.autoScroll || false;
  this.closeMethod = params.closeMethod || 'hide';
  this.recentMessagesAtTop = params.recentMessagesAtTop || false;
  this.position = params.position || 'bottom';
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
      class: 'panel-resize-handle',
      style: 'position: absolute; top: 0; left: 0; right: 0; height: 10px; cursor: row-resize; z-index: 3'
    });
    this.div({
      class: 'panel-heading'
    }, function () {
      this.div({
        class: 'heading-title inline-block',
        style: 'cursor: pointer',
        outlet: 'heading',
        click: 'toggle'
      });
      this.div({
        class: 'heading-summary inline-block',
        outlet: 'summary'
      });
      this.div({
        class: 'heading-buttoms inline-block pull-right'
      }, function () {
        this.div({
          class: 'heading-autoScroll inline-block icon-move-down',
          style: 'cursor: pointer',
          outlet: 'btnAutoScroll',
          click: 'toggleAutoScroll'
        });
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
      style: 'overflow-y: scroll;'
    });
  }.bind(this));
};

MessagePanelView.prototype.attach = function () {
  if (this.panel === undefined) {
    if (this.position === 'bottom') {
      this.panel = atom.workspace.addBottomPanel({item: this});
    } else if (this.position === 'top') {
      this.panel = atom.workspace.addTopPanel({item: this});
    }

    var that = this;
    this.panel.item.on("mousedown", ".panel-resize-handle", function () {
      that.resizeStarted();
    });

    $(".panel-body", this).css({
      maxHeight: this.maxHeight
    });

    if (this.btnAutoScroll.hasClass('icon-move-up')) {
      this.body.scrollTop(1E10);
    }
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
  if (this.autoScroll) {
    this.toggleAutoScroll();
  }
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
  if (this.recentMessagesAtTop) {
    this.body.prepend(view);
  } else {
    this.body.append(view);
  }
  this.messages.push(view);
};

MessagePanelView.prototype.updateScroll = function () {
  if (this.btnAutoScroll.hasClass('icon-move-up')) {
    this.body.scrollTop(1E10);
  } else {
    this.body.scrollTop(0);
  }
};

MessagePanelView.prototype.toggleAutoScroll = function () {
  this.btnAutoScroll.toggleClass('icon-move-up');
  this.updateScroll();
};

MessagePanelView.prototype.resizeStarted = function () {
  $(this).css({
    WebkitUserSelect: 'none'
  });

  $(document).on('mousemove', {that: this}, this.resizePanel);
  $(document).on('mouseup', {that: this}, this.resizeStopped);
};

MessagePanelView.prototype.resizeStopped = function (e) {
  $(e.data.that).css({
    WebkitUserSelect: ''
  });

  $(document).off('mousemove', this.resizePanel);
  $(document).off('mouseup', this.resizeStopped);
};

MessagePanelView.prototype.resizePanel = function (e) {
  var
    panelBody = $(".panel-body", e.data.that),
    panelHeadingHeight = $(".panel-heading", e.data.that).height(),
    newHeight = $(document.body).height() - e.pageY - panelHeadingHeight - 30;

  panelBody.css({
    maxHeight: newHeight
  });
};

module.exports = MessagePanelView;
