var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var view = require('./view');
var $ = view.$;
var AstView = (function (_super) {
    __extends(AstView, _super);
    function AstView() {
        _super.apply(this, arguments);
    }
    AstView.content = function () {
        var _this = this;
        return this.div({ class: 'awesome' }, function () { return _this.div({ class: 'dude', outlet: 'something' }); });
    };
    AstView.prototype.init = function () {
        console.log('HERERERERERER');
        this.something.html('<div>tada</div>');
    };
    return AstView;
})(view.View);
exports.AstView = AstView;
