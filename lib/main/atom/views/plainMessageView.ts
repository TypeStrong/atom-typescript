import view = require('./view');
var $ = view.$;
import path = require('path');

export interface ViewOptions {
    /** your message to the people */
    message: string;
    className: string;
}

export class PlainMessageView extends view.View<ViewOptions> {

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