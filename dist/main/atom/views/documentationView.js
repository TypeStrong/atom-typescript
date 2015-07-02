var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var view = require('./view');
var $ = view.$;
var DocumentationView = (function (_super) {
    __extends(DocumentationView, _super);
    function DocumentationView() {
        _super.apply(this, arguments);
        this.shown = false;
    }
    DocumentationView.content = function () {
        var _this = this;
        return this.div({ class: 'atom-ts-documentation padded top' }, function () { return _this.div(function () {
            _this.h2({ outlet: 'header' });
            _this.p({ outlet: 'documentation' });
        }); });
    };
    DocumentationView.prototype.show = function () { this.$.addClass('active'); this.shown = true; };
    DocumentationView.prototype.hide = function () { this.$.removeClass('active'); this.shown = false; };
    DocumentationView.prototype.toggle = function () { if (this.shown) {
        this.hide();
    }
    else {
        this.show();
    } };
    DocumentationView.prototype.setContent = function (content) {
        this.header.html(content.display);
        content.documentation = content.documentation.replace(/(?:\r\n|\r|\n)/g, '<br />');
        this.documentation.html(content.documentation);
    };
    DocumentationView.prototype.autoPosition = function () {
        var editor = atom.workspace.getActiveTextEditor();
        var cursor = editor.getCursors()[0];
        var cursorTop = cursor.getPixelRect().top - editor.getScrollTop();
        var editorHeight = editor.getHeight();
        if (editorHeight - cursorTop < 100) {
            this.$.removeClass('bottom');
            this.$.addClass('top');
        }
        else {
            this.$.removeClass('top');
            this.$.addClass('bottom');
        }
    };
    return DocumentationView;
})(view.View);
exports.DocumentationView = DocumentationView;
function attach() {
    if (exports.docView)
        return;
    exports.docView = new DocumentationView({});
    $(atom.views.getView(atom.workspace)).append(exports.docView.$);
}
exports.attach = attach;
function testDocumentationView() {
    exports.docView.setContent({
        display: "this is awesome", documentation: "\n    some docs\n    over\n    many\n    many li\n\n    lines\n    long\n    so\n    long\n    that\n    it\n    should\n\n    start\n    to\n    scroll\n    ", filePath: "some filepath"
    });
    exports.docView.show();
}
exports.testDocumentationView = testDocumentationView;
