(function() {
  var $, Builder, CustomElementPrototype, Events, Grim, JQueryEventAdd, SelfClosingTags, Tags, View, docEl, exports, idCounter, jQuery, matches, matchesSelector, registerElement, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  if (typeof require === 'function') {
    _ = require('underscore-plus');
    $ = jQuery = require('jquery');
    Grim = require('grim');
  } else {
    _ = window._, jQuery = window.jQuery;
    $ = jQuery;
  }

  Tags = 'a abbr address article aside audio b bdi bdo blockquote body button canvas\
   caption cite code colgroup datalist dd del details dfn dialog div dl dt em\
   fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header html i\
   iframe ins kbd label legend li main map mark menu meter nav noscript object\
   ol optgroup option output p pre progress q rp rt ruby s samp script section\
   select small span strong style sub summary sup table tbody td textarea tfoot\
   th thead time title tr u ul var video area base br col command embed hr img\
   input keygen link meta param source track wbr'.split(/\s+/);

  SelfClosingTags = {};

  'area base br col command embed hr img input keygen link meta param\
 source track wbr'.split(/\s+/).forEach(function(tag) {
    return SelfClosingTags[tag] = true;
  });

  Events = 'blur change click dblclick error focus input keydown\
   keypress keyup load mousedown mousemove mouseout mouseover\
   mouseup resize scroll select submit unload'.split(/\s+/);

  docEl = document.documentElement;

  matches = docEl.matchesSelector || docEl.mozMatchesSelector || docEl.webkitMatchesSelector || docEl.oMatchesSelector || docEl.msMatchesSelector;

  matchesSelector = matches ? (function(elem, selector) {
    return matches.call(elem[0], selector);
  }) : (function(elem, selector) {
    return elem.is(selector);
  });

  idCounter = 0;

  CustomElementPrototype = Object.create(HTMLElement.prototype);

  CustomElementPrototype.attachedCallback = function() {
    return typeof this.attached === "function" ? this.attached() : void 0;
  };

  CustomElementPrototype.detachedCallback = function() {
    return typeof this.detached === "function" ? this.detached() : void 0;
  };

  if (window.__spacePenCustomElements == null) {
    window.__spacePenCustomElements = {};
  }

  registerElement = function(tagName) {
    var customTagName, _base;
    customTagName = "space-pen-" + tagName;
    if ((_base = window.__spacePenCustomElements)[customTagName] == null) {
      _base[customTagName] = typeof document.registerElement === "function" ? document.registerElement(customTagName, {
        prototype: Object.create(CustomElementPrototype),
        "extends": tagName
      }) : void 0;
    }
    return customTagName;
  };

  View = (function(_super) {
    __extends(View, _super);

    View.builderStack = null;

    Tags.forEach(function(tagName) {
      return View[tagName] = function() {
        var args, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return (_ref = this.currentBuilder).tag.apply(_ref, [tagName].concat(__slice.call(args)));
      };
    });

    View.subview = function(name, view) {
      return this.currentBuilder.subview(name, view);
    };

    View.text = function(string) {
      return this.currentBuilder.text(string);
    };

    View.tag = function() {
      var args, tagName, _ref;
      tagName = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return (_ref = this.currentBuilder).tag.apply(_ref, [tagName].concat(__slice.call(args)));
    };

    View.raw = function(string) {
      return this.currentBuilder.raw(string);
    };

    View.pushBuilder = function() {
      var builder;
      builder = new Builder;
      if (this.builderStack == null) {
        this.builderStack = [];
      }
      this.builderStack.push(builder);
      return this.currentBuilder = builder;
    };

    View.popBuilder = function() {
      this.currentBuilder = this.builderStack[this.builderStack.length - 2];
      return this.builderStack.pop();
    };

    View.buildHtml = function(fn) {
      var html, postProcessingSteps, _ref;
      this.pushBuilder();
      fn.call(this);
      return _ref = this.popBuilder().buildHtml(), html = _ref[0], postProcessingSteps = _ref[1], _ref;
    };

    View.render = function(fn) {
      var div, fragment, html, postProcessingSteps, step, _i, _len, _ref;
      _ref = this.buildHtml(fn), html = _ref[0], postProcessingSteps = _ref[1];
      div = document.createElement('div');
      div.innerHTML = html;
      fragment = $(div.childNodes);
      for (_i = 0, _len = postProcessingSteps.length; _i < _len; _i++) {
        step = postProcessingSteps[_i];
        step(fragment);
      }
      return fragment;
    };

    View.prototype.element = null;

    function View() {
      var args, element, html, postProcessingSteps, step, treeWalker, _i, _len, _ref,
        _this = this;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (typeof this.afterAttach === 'function') {
        throw new Error("The ::afterAttach hook has been replaced by ::attached. See https://github.com/atom/space-pen#attacheddetached-hooks for details.");
      }
      if (typeof this.beforeRemove === 'function') {
        throw new Error("The ::beforeRemove hook has been replaced by ::detached. See https://github.com/atom/space-pen#attacheddetached-hooks for details.");
      }
      if (this.element != null) {
        jQuery.fn.init.call(this, this.element);
      } else {
        _ref = this.constructor.buildHtml(function() {
          return this.content.apply(this, args);
        }), html = _ref[0], postProcessingSteps = _ref[1];
        jQuery.fn.init.call(this, html);
        if (this.length !== 1) {
          throw new Error("View markup must have a single root element");
        }
        this.element = this[0];
        this.element.attached = function() {
          return typeof _this.attached === "function" ? _this.attached() : void 0;
        };
        this.element.detached = function() {
          return typeof _this.detached === "function" ? _this.detached() : void 0;
        };
      }
      this.wireOutlets(this);
      this.bindEventHandlers(this);
      this.element.spacePenView = this;
      treeWalker = document.createTreeWalker(this.element, NodeFilter.SHOW_ELEMENT);
      while (element = treeWalker.nextNode()) {
        element.spacePenView = this;
      }
      if (postProcessingSteps != null) {
        for (_i = 0, _len = postProcessingSteps.length; _i < _len; _i++) {
          step = postProcessingSteps[_i];
          step(this);
        }
      }
      if (typeof this.initialize === "function") {
        this.initialize.apply(this, args);
      }
    }

    View.prototype.buildHtml = function(params) {
      var html, postProcessingSteps, _ref;
      this.constructor.builder = new Builder;
      this.constructor.content(params);
      _ref = this.constructor.builder.buildHtml(), html = _ref[0], postProcessingSteps = _ref[1];
      this.constructor.builder = null;
      return postProcessingSteps;
    };

    View.prototype.wireOutlets = function(view) {
      var element, outlet, _i, _len, _ref;
      _ref = view[0].querySelectorAll('[outlet]');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        element = _ref[_i];
        outlet = element.getAttribute('outlet');
        view[outlet] = $(element);
        element.removeAttribute('outlet');
      }
      return void 0;
    };

    View.prototype.bindEventHandlers = function(view) {
      var element, eventName, methodName, selector, _fn, _i, _j, _len, _len1, _ref;
      for (_i = 0, _len = Events.length; _i < _len; _i++) {
        eventName = Events[_i];
        selector = "[" + eventName + "]";
        _ref = view[0].querySelectorAll(selector);
        _fn = function(element) {
          var methodName;
          methodName = element.getAttribute(eventName);
          element = $(element);
          return element.on(eventName, function(event) {
            return view[methodName](event, element);
          });
        };
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          element = _ref[_j];
          _fn(element);
        }
        if (matchesSelector(view, selector)) {
          methodName = view[0].getAttribute(eventName);
          (function(methodName) {
            return view.on(eventName, function(event) {
              return view[methodName](event, view);
            });
          })(methodName);
        }
      }
      return void 0;
    };

    View.prototype.pushStack = function(elems) {
      var ret;
      ret = jQuery.merge(jQuery(), elems);
      ret.prevObject = this;
      ret.context = this.context;
      return ret;
    };

    View.prototype.end = function() {
      var _ref;
      return (_ref = this.prevObject) != null ? _ref : jQuery(null);
    };

    View.prototype.preempt = function(eventName, handler) {
      return View.__super__.preempt.call(this, eventName, handler);
    };

    return View;

  })(jQuery);

  Builder = (function() {
    function Builder() {
      this.document = [];
      this.postProcessingSteps = [];
    }

    Builder.prototype.buildHtml = function() {
      return [this.document.join(''), this.postProcessingSteps];
    };

    Builder.prototype.tag = function() {
      var args, name, options;
      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      options = this.extractOptions(args);
      this.openTag(name, options.attributes);
      if (SelfClosingTags.hasOwnProperty(name)) {
        if ((options.text != null) || (options.content != null)) {
          throw new Error("Self-closing tag " + name + " cannot have text or content");
        }
      } else {
        if (typeof options.content === "function") {
          options.content();
        }
        if (options.text) {
          this.text(options.text);
        }
        return this.closeTag(name);
      }
    };

    Builder.prototype.openTag = function(name, attributes) {
      var attributeName, attributePairs, attributesString, value;
      if (this.document.length === 0) {
        if (attributes == null) {
          attributes = {};
        }
        if (attributes.is == null) {
          attributes.is = registerElement(name);
        }
      }
      attributePairs = (function() {
        var _results;
        _results = [];
        for (attributeName in attributes) {
          value = attributes[attributeName];
          _results.push("" + attributeName + "=\"" + value + "\"");
        }
        return _results;
      })();
      attributesString = attributePairs.length ? " " + attributePairs.join(" ") : "";
      return this.document.push("<" + name + attributesString + ">");
    };

    Builder.prototype.closeTag = function(name) {
      return this.document.push("</" + name + ">");
    };

    Builder.prototype.text = function(string) {
      var escapedString;
      escapedString = string.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return this.document.push(escapedString);
    };

    Builder.prototype.raw = function(string) {
      return this.document.push(string);
    };

    Builder.prototype.subview = function(outletName, subview) {
      var subviewId;
      subviewId = "subview-" + (++idCounter);
      this.tag('div', {
        id: subviewId
      });
      return this.postProcessingSteps.push(function(view) {
        view[outletName] = subview;
        subview.parentView = view;
        return view.find("div#" + subviewId).replaceWith(subview);
      });
    };

    Builder.prototype.extractOptions = function(args) {
      var arg, options, _i, _len;
      options = {};
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        arg = args[_i];
        switch (typeof arg) {
          case 'function':
            options.content = arg;
            break;
          case 'string':
          case 'number':
            options.text = arg.toString();
            break;
          default:
            options.attributes = arg;
        }
      }
      return options;
    };

    return Builder;

  })();

  $.fn.view = function() {
    var element, viewConstructorName;
    if (element = this[0]) {
      if ((element.__spacePenView != null) && !element.__allowViewAccess) {
        viewConstructorName = element.__spacePenView.constructor.name;
        if (Grim != null) {
          Grim.deprecate("Accessing `" + viewConstructorName + "` via `$::view()` is deprecated. Use the raw DOM node or underlying model object instead.");
        }
      }
      return element.spacePenView;
    }
  };

  $.fn.views = function() {
    return this.toArray().map(function(elt) {
      var $elt, _ref;
      $elt = $(elt);
      return (_ref = $elt.view()) != null ? _ref : $elt;
    });
  };

  $.fn.containingView = function() {
    var element, view;
    element = this[0];
    while (element != null) {
      if (view = element.spacePenView) {
        return view;
      }
      element = element.parentNode;
    }
  };

  $.fn.scrollBottom = function(newValue) {
    if (newValue != null) {
      return this.scrollTop(newValue - this.height());
    } else {
      return this.scrollTop() + this.height();
    }
  };

  $.fn.scrollDown = function() {
    return this.scrollTop(this.scrollTop() + $(window).height() / 20);
  };

  $.fn.scrollUp = function() {
    return this.scrollTop(this.scrollTop() - $(window).height() / 20);
  };

  $.fn.scrollToTop = function() {
    return this.scrollTop(0);
  };

  $.fn.scrollToBottom = function() {
    return this.scrollTop(this.prop('scrollHeight'));
  };

  $.fn.scrollRight = function(newValue) {
    if (newValue != null) {
      return this.scrollLeft(newValue - this.width());
    } else {
      return this.scrollLeft() + this.width();
    }
  };

  $.fn.pageUp = function() {
    return this.scrollTop(this.scrollTop() - this.height());
  };

  $.fn.pageDown = function() {
    return this.scrollTop(this.scrollTop() + this.height());
  };

  $.fn.isOnDom = function() {
    return this.closest(document.body).length === 1;
  };

  $.fn.isVisible = function() {
    return !this.isHidden();
  };

  $.fn.isHidden = function() {
    var style;
    style = this[0].style;
    if (style.display === 'none' || !this.isOnDom()) {
      return true;
    } else if (style.display) {
      return false;
    } else {
      return getComputedStyle(this[0]).display === 'none';
    }
  };

  $.fn.isDisabled = function() {
    return !!this.attr('disabled');
  };

  $.fn.enable = function() {
    return this.removeAttr('disabled');
  };

  $.fn.disable = function() {
    return this.attr('disabled', 'disabled');
  };

  $.fn.insertAt = function(index, element) {
    var target;
    target = this.children(":eq(" + index + ")");
    if (target.length) {
      return $(element).insertBefore(target);
    } else {
      return this.append(element);
    }
  };

  $.fn.removeAt = function(index) {
    return this.children(":eq(" + index + ")").remove();
  };

  $.fn.indexOf = function(child) {
    return this.children().toArray().indexOf($(child)[0]);
  };

  $.fn.containsElement = function(element) {
    return (element[0].compareDocumentPosition(this[0]) & 8) === 8;
  };

  $.fn.preempt = function(eventName, handler) {
    var eventNameWithoutNamespace, handlers, wrappedHandler, _ref,
      _this = this;
    wrappedHandler = function() {
      var args, e;
      e = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (handler.apply(null, [e].concat(__slice.call(args))) === false) {
        return e.stopImmediatePropagation();
      }
    };
    this.on(eventName, wrappedHandler);
    eventNameWithoutNamespace = eventName.split('.')[0];
    handlers = (_ref = this.handlers()[eventNameWithoutNamespace]) != null ? _ref : [];
    handlers.unshift(handlers.pop());
    return {
      off: function() {
        return _this.off(eventName, wrappedHandler);
      }
    };
  };

  $.fn.handlers = function(eventName) {
    var handlers, _ref, _ref1;
    handlers = this.length ? (_ref = $._data(this[0], 'events')) != null ? _ref : {} : {};
    if (arguments.length === 1) {
      handlers = (_ref1 = handlers[eventName]) != null ? _ref1 : [];
    }
    return handlers;
  };

  $.fn.hasParent = function() {
    return this.parent()[0] != null;
  };

  $.fn.hasFocus = function() {
    return this.is(':focus') || this.is(':has(:focus)');
  };

  $.fn.flashError = function() {
    var removeErrorClass,
      _this = this;
    this.addClass('error');
    removeErrorClass = function() {
      return _this.removeClass('error');
    };
    return window.setTimeout(removeErrorClass, 300);
  };

  $.fn.trueHeight = function() {
    return this[0].getBoundingClientRect().height;
  };

  $.fn.trueWidth = function() {
    return this[0].getBoundingClientRect().width;
  };

  $.fn.iconSize = function(size) {
    return this.width(size).height(size).css('font-size', size);
  };

  $.fn.intValue = function() {
    return parseInt(this.text());
  };

  $.Event.prototype.abortKeyBinding = function() {};

  $.Event.prototype.currentTargetView = function() {
    return $(this.currentTarget).containingView();
  };

  $.Event.prototype.targetView = function() {
    return $(this.target).containingView();
  };

  View.prototype.subscribe = function() {
    var message, _ref;
    message = "The `::subscribe` method is no longer available on SpacePen views.\n\n";
    if (arguments.length === 1) {
      message += "To store multiple subscription objects for later disposal, add them to a\n`CompositeDisposable` instance (https://atom.io/docs/api/v0.150.0/CompositeDisposable)\nand call `.dispose()` on it explicitly in this view's `::detached` hook.";
    } else {
      if ((_ref = arguments[0]) != null ? _ref.jquery : void 0) {
        message += "To subscribe to events on a jQuery object, use the traditional `::on` and\n`::off methods`.";
      } else {
        message += "To subscribe to events on an Atom object, use an explicit event-subscription\nmethod (starting with ::onDid* or ::onWill*).\n\nTo collect multiple subscription objects for later disposal, add them to a\n`CompositeDisposable` instance:\nhttps://atom.io/docs/api/v0.150.0/CompositeDisposable\n\nCall `.dispose()` on your `CompositeDisposable` in this view's `::detached` hook.";
      }
    }
    throw new Error(message);
  };

  View.prototype.subscribeToCommand = function() {
    throw new Error("The `::subscribeToCommand` method is no longer available on SpacePen views.\"\n\nPlease subscribe to commands via `atom.commands.add`:\nhttps://atom.io/docs/api/latest/CommandRegistry#instance-add\n\nCollect the returned subscription objects in a CompositeDisposable:\nhttps://atom.io/docs/api/latest/CompositeDisposable\n\nCall `.dispose()` on your `CompositeDisposable` in this view's `::detached` hook.");
  };

  $.fn.command = function(eventName, handler) {
    throw new Error("The `::command` method is no longer available on SpacePen views.\"\n\nPlease subscribe to commands via `atom.commands.add`:\nhttps://atom.io/docs/api/latest/CommandRegistry#instance-add\n\nCollect the returned subscription objects in a CompositeDisposable:\nhttps://atom.io/docs/api/latest/CompositeDisposable\n\nCall `.dispose()` on your `CompositeDisposable` in this view's `::detached` hook.");
  };

  JQueryEventAdd = jQuery.event.add;

  jQuery.event.add = function(elem, types, handler, data, selector) {
    if (/\:/.test(types)) {
      if (Grim != null) {
        Grim.deprecate("Are you trying to listen for the '" + types + "' Atom command with `jQuery::on`?\n`jQuery::trigger` can no longer be used to listen for Atom commands. Please\nuse `atom.commands.add` instead. See the docs at\nhttps://atom.io/docs/api/latest/CommandRegistry#instance-add for details.");
      }
    }
    return JQueryEventAdd.call(this, elem, types, handler, data, selector);
  };

  if ($.fn.originalTrigger == null) {
    $.fn.originalTrigger = $.fn.trigger;
    $.fn.trigger = function(eventName, data) {
      if (typeof eventName === 'string' && /\:/.test(eventName) && (eventName !== 'cursor:moved' && eventName !== 'selection:changed' && eventName !== 'editor:display-updated')) {
        if (Grim != null) {
          Grim.deprecate("Are you trying to dispatch the '" + eventName + "' Atom command with `jQuery::trigger`?\n`jQuery::trigger` can no longer emit Atom commands as it will not correctly route\nthe command to its handlers. Please use `atom.commands.dispatch` instead.\nSee the docs at https://atom.io/docs/api/latest/CommandRegistry#instance-dispatch\nfor details.");
        }
      }
      return this.originalTrigger(eventName, data);
    };
  }

  $.fn.setTooltip = function() {
    throw new Error("setTooltip is no longer available. Please use `atom.tooltips.add` instead.\nSee the docs at https://atom.io/docs/api/latest/TooltipManager#instance-add");
  };

  $.fn.destroyTooltip = $.fn.hideTooltip = function() {
    throw new Error("destroyTooltip is no longer available. Please dispose the object returned\nfrom  `atom.tooltips.add` instead.\nSee the docs at https://atom.io/docs/api/latest/TooltipManager#instance-add");
  };

  exports = exports != null ? exports : this;

  exports.View = View;

  exports.jQuery = jQuery;

  exports.$ = $;

  exports.$$ = function(fn) {
    return View.render.call(View, fn);
  };

  exports.$$$ = function(fn) {
    return View.buildHtml.call(View, fn)[0];
  };

}).call(this);
