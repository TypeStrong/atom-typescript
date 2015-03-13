(function() {
  var CompositeDisposable;

  module.exports = CompositeDisposable = (function() {
    CompositeDisposable.prototype.disposed = false;


    /*
    Section: Construction and Destruction
     */

    function CompositeDisposable() {
      var disposable, _i, _len;
      this.disposables = [];
      for (_i = 0, _len = arguments.length; _i < _len; _i++) {
        disposable = arguments[_i];
        this.add(disposable);
      }
    }

    CompositeDisposable.prototype.dispose = function() {
      var disposable, _results;
      if (!this.disposed) {
        this.disposed = true;
        _results = [];
        while (disposable = this.disposables.shift()) {
          _results.push(disposable.dispose());
        }
        return _results;
      }
    };


    /*
    Section: Managing Disposables
     */

    CompositeDisposable.prototype.add = function(disposable) {
      if (!this.disposed) {
        return this.disposables.push(disposable);
      }
    };

    CompositeDisposable.prototype.remove = function(disposable) {
      var index;
      index = this.disposables.indexOf(disposable);
      if (index !== -1) {
        return this.disposables.splice(index, 1);
      }
    };

    CompositeDisposable.prototype.clear = function() {
      return this.disposables.length = 0;
    };

    return CompositeDisposable;

  })();

}).call(this);
