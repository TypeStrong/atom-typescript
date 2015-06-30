import view = require('./view');
var $ = view.$;
import path = require('path');

export interface ViewOptions {
    /** This is needed to support good goto next / goto previous logic
     *  We inform the parent about our navigation
     */
    goToLine: (filePath: string, line: number, col: number) => any;
    /** your message to the people */
    message: string;
    /** what line are we talking about? */
    line: number;
    /** which column */
    col: number;
    /** so, was that in some other file? */
    file: string;
    /** lets you display a code snippet inside a pre tag */
    preview: string;
}

export class LineMessageView extends view.View<ViewOptions> {

    public index: number;
    private position: JQuery;
    private contents: JQuery;
    private code: JQuery;
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
        } else {
            this.code.remove();
        }
    }

    goToLine() {
        this.options.goToLine(this.options.file, this.options.line, this.options.col);
    }

    getSummary() {
        var pos = this.options.line.toString();
        if (this.options.file !== undefined) {
            pos += ', ' + this.options.file;
        }
        return {
            summary: pos + ' ' + this.options.message,
            rawSummary: true,
            handler: function(element) {
                $(element)
                    .css('cursor', 'pointer')
                    .click(this.goToLine.bind(this));
            }.bind(this)
        };
    }

}
