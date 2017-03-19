"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view = require("./view");
class PlainMessageView extends view.View {
    static content() {
        this.div({
            class: 'plain-message'
        });
    }
    init() {
        this.$.html(this.options.message);
        this.$.addClass(this.options.className);
    }
    getSummary() {
        return {
            summary: this.options.message,
            rawSummary: true,
            className: this.options.className
        };
    }
}
exports.PlainMessageView = PlainMessageView;
