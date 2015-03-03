var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var view = require('./view');
var $ = view.$;
var LineMessageView = (function (_super) {
    __extends(LineMessageView, _super);
    function LineMessageView() {
        _super.apply(this, arguments);
    }
    LineMessageView.content = function () {
        var _this = this;
        return this.div({
            class: 'line-message'
        }, function () {
            _this.div({
                class: 'text-subtle inline-block',
                outlet: 'position',
                click: 'goToLine',
                style: 'cursor: pointer;'
            });
            _this.div({
                class: 'message inline-block',
                outlet: 'contents'
            });
            _this.pre({
                class: 'preview',
                outlet: 'code',
                click: 'goToLine',
                style: 'cursor: pointer;'
            });
        });
    };
    LineMessageView.prototype.init = function () {
        var message = 'at line ' + this.options.line;
        if (this.options.file !== undefined) {
            message += ', file ' + this.options.file;
        }
        this.position.text(message);
        this.contents.text(this.options.message);
        if (this.options.preview) {
            this.code.text(this.options.preview);
        }
        else {
            this.code.remove();
        }
    };
    LineMessageView.prototype.goToLine = function () {
        var char = 0;
        var activeFile, activeEditor = atom.workspace.getActiveEditor();
        if (activeEditor !== undefined && activeEditor !== null) {
            activeFile = activeEditor.getPath();
        }
        if (this.options.file !== undefined && this.options.file !== activeFile) {
            atom.workspace.open(this.options.file, {
                initialLine: this.options.line - 1,
                initialColumn: char
            });
        }
        else {
            atom.workspace.getActiveEditor().cursors[0].setBufferPosition([this.options.line - 1, char]);
        }
    };
    LineMessageView.prototype.getSummary = function () {
        var pos = this.options.line.toString();
        if (this.options.file !== undefined) {
            pos += ', ' + this.options.file;
        }
        return {
            summary: '<span>' + pos + '</span>: ' + this.options.message,
            rawSummary: true,
            handler: function (element) {
                $('span', element).css('cursor', 'pointer').click(this.goToLine.bind(this));
            }.bind(this)
        };
    };
    return LineMessageView;
})(view.View);
exports.LineMessageView = LineMessageView;
