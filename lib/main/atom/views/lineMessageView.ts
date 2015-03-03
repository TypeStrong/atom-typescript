import view = require('./view');
var $ = view.$;
import path = require('path');

export interface ViewOptions {
    /** your message to the people */
    message: string;
    /**  what line are we talking about? */
    line: number;
    /** so, was that in some other file? */
    file: string; 
    /** lets you display a code snippet inside a pre tag */
    preview: string;
}

export class LineMessageView extends view.View<ViewOptions> {

    private position: JQuery;
    private contents: JQuery;
    private code: JQuery;
    static content() {
        return this.div({
            class: 'line-message'
        },() => {
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
        var char = 0;
        var activeFile,
            activeEditor = atom.workspace.getActiveEditor();
        if (activeEditor !== undefined && activeEditor !== null) {
            activeFile = activeEditor.getPath();
        }

        if (this.options.file !== undefined && this.options.file !== activeFile) {
            atom.workspace.open(this.options.file, {
                initialLine: this.options.line - 1,
                initialColumn: char
            });
        } else {
            atom.workspace.getActiveEditor().cursors[0].setBufferPosition([this.options.line - 1, char]);
        }
    }

    getSummary() {
        var pos = this.options.line.toString();
        if (this.options.file !== undefined) {
            pos += ', ' + this.options.file;
        }
        return {
            summary: '<span>' + pos + '</span>: ' + this.options.message,
            rawSummary: true,
            handler: function(element) {
                $('span', element)
                    .css('cursor', 'pointer')
                    .click(this.goToLine.bind(this));
            }.bind(this)
        };
    }

}