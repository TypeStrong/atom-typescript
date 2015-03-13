(function() {
  var Disposable, Emitter;

  Disposable = require('./disposable');

  module.exports = Emitter = (function() {
    Emitter.prototype.isDisposed = false;


    /*
    Section: Construction and Destruction
     */

    function Emitter() {
      this.handlersByEventName = {};
    }

    Emitter.prototype.dispose = function() {
      this.handlersByEventName = null;
      return this.isDisposed = true;
    };


    /*
    Section: Event Subscription
     */

    Emitter.prototype.on = function(eventName, handler, unshift) {
      var currentHandlers;
      if (unshift == null) {
        unshift = false;
      }
      if (this.isDisposed) {
        throw new Error("Emitter has been disposed");
      }
      if (typeof handler !== 'function') {
        throw new Error("Handler must be a function");
      }
      if (currentHandlers = this.handlersByEventName[eventName]) {
        if (unshift) {
          this.handlersByEventName[eventName] = [handler].concat(currentHandlers);
        } else {
          this.handlersByEventName[eventName] = currentHandlers.concat(handler);
        }
      } else {
        this.handlersByEventName[eventName] = [handler];
      }
      return new Disposable(this.off.bind(this, eventName, handler));
    };

    Emitter.prototype.preempt = function(eventName, handler) {
      return this.on(eventName, handler, true);
    };

    Emitter.prototype.off = function(eventName, handlerToRemove) {
      var handler, newHandlers, oldHandlers, _i, _len;
      if (this.isDisposed) {
        return;
      }
      if (oldHandlers = this.handlersByEventName[eventName]) {
        newHandlers = [];
        for (_i = 0, _len = oldHandlers.length; _i < _len; _i++) {
          handler = oldHandlers[_i];
          if (handler !== handlerToRemove) {
            newHandlers.push(handler);
          }
        }
        return this.handlersByEventName[eventName] = newHandlers;
      }
    };


    /*
    Section: Event Emission
     */

    Emitter.prototype.emit = function(eventName, value) {
      var handler, handlers, _i, _len, _ref;
      if (handlers = (_ref = this.handlersByEventName) != null ? _ref[eventName] : void 0) {
        for (_i = 0, _len = handlers.length; _i < _len; _i++) {
          handler = handlers[_i];
          handler(value);
        }
      }
    };

    return Emitter;

  })();

}).call(this);
