"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var view = require("./view");
var $ = view.$;
var LineMessageView = (function (_super) {
    __extends(LineMessageView, _super);
    function LineMessageView() {
        return _super !== null && _super.apply(this, arguments) || this;
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
        this.options.goToLine(this.options.file, this.options.line, this.options.col);
    };
    LineMessageView.prototype.getSummary = function () {
        var pos = this.options.line.toString();
        if (this.options.file !== undefined) {
            pos += ', ' + this.options.file;
        }
        return {
            summary: pos + ' ' + this.options.message,
            rawSummary: true,
            handler: function (element) {
                $(element)
                    .css('cursor', 'pointer')
                    .click(this.goToLine.bind(this));
            }.bind(this)
        };
    };
    return LineMessageView;
}(view.View));
exports.LineMessageView = LineMessageView;
