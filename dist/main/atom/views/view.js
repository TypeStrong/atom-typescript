"use strict";
var tslib_1 = require("tslib");
var sp = require("atom-space-pen-views");
var View = (function (_super) {
    tslib_1.__extends(View, _super);
    function View(options) {
        var _this = _super.call(this) || this;
        _this.options = options;
        _this.init();
        return _this;
    }
    Object.defineProperty(View.prototype, "$", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    View.content = function () {
        throw new Error('Must override the base View static content member');
    };
    View.prototype.init = function () { };
    return View;
}(sp.View));
exports.View = View;
exports.$ = sp.$;
var ScrollView = (function (_super) {
    tslib_1.__extends(ScrollView, _super);
    function ScrollView(options) {
        var _this = _super.call(this) || this;
        _this.options = options;
        _this.init();
        return _this;
    }
    Object.defineProperty(ScrollView.prototype, "$", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    ScrollView.content = function () {
        throw new Error('Must override the base View static content member');
    };
    ScrollView.prototype.init = function () { };
    return ScrollView;
}(sp.ScrollView));
exports.ScrollView = ScrollView;
