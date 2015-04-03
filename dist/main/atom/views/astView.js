var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var sp = require('atom-space-pen-views');
var parent = require("../../../worker/parent");
exports.astURI = "ts-ast:";
function astUriForPath(filePath) {
    return exports.astURI + "//" + filePath;
}
exports.astUriForPath = astUriForPath;
var AstView = (function (_super) {
    __extends(AstView, _super);
    function AstView(filePath) {
        var _this = this;
        _super.call(this);
        this.filePath = filePath;
        this.getURI = function () { return astUriForPath(_this.filePath); };
        this.getTitle = function () { return 'TypeScript AST'; };
        this.getIconName = function () { return 'repo-forked'; };
        this.init();
    }
    AstView.content = function () {
        var _this = this;
        return this.div({ class: 'awesome' }, function () { return _this.div({ class: 'dude', outlet: 'something' }); });
    };
    AstView.prototype.init = function () {
        console.log('HERERERERERER');
        this.something.html('<div>tada</div>');
        parent.getAST({ filePath: this.filePath }).then(function (res) {
            console.log(res.root);
        });
    };
    return AstView;
})(sp.ScrollView);
exports.AstView = AstView;
