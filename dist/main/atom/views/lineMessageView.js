"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view = require("./view");
var $ = view.$;
class LineMessageView extends view.View {
    constructor() {
        super(...arguments);
        this.goToLine = () => {
            this.options.goToLine(this.options.file, this.options.line, this.options.col);
        };
        this.getSummary = () => {
            var pos = this.options.line.toString();
            if (this.options.file !== undefined) {
                pos += ', ' + this.options.file;
            }
            return {
                summary: pos + ' ' + this.options.message,
                rawSummary: true,
                handler: (element) => {
                    $(element)
                        .css('cursor', 'pointer')
                        .click(this.goToLine);
                }
            };
        };
    }
    static content() {
        return this.div({
            class: 'line-message'
        }, () => {
            this.div({
                class: 'text-subtle inline-block',
                outlet: 'position',
                click: 'goToLine',
                style: 'cursor: pointer;'
            });
            this.div({
                class: 'message inline-block',
                outlet: 'contents'
            });
            this.pre({
                class: 'preview',
                outlet: 'code',
                click: 'goToLine',
                style: 'cursor: pointer;'
            });
        });
    }
    init() {
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
    }
}
exports.LineMessageView = LineMessageView;
