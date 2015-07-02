import view = require('./view');
var $ = view.$;

export class DocumentationView extends view.View<any> {

    private header: JQuery;
    private documentation: JQuery;
    static content() {
        return this.div({ class: 'atom-ts-documentation padded top' },
            () => this.div(  // TODO: repeat for each documentation entry
                () => {
                    this.h2({ outlet: 'header' });
                    this.p({ outlet: 'documentation' });
                })
            );
    }


    private shown = false;
    show() { this.$.addClass('active'); this.shown = true; }
    hide() { this.$.removeClass('active'); this.shown = false; }
    toggle() { if (this.shown) { this.hide(); } else { this.show(); } }

    setContent(content: { display: string; documentation: string; filePath: string }) {
        this.header.html(content.display);
        content.documentation = content.documentation.replace(/(?:\r\n|\r|\n)/g, '<br />');
        this.documentation.html(content.documentation);
    }

    autoPosition() {
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
            this.$.addClass('bottom')
        }
    }
}

export var docView: DocumentationView;

export function attach() {
    if (docView) return;
    docView = new DocumentationView({});
    $(atom.views.getView(atom.workspace)).append(docView.$);
    //    testDocumentationView();
}

export function testDocumentationView() {
    docView.setContent({
        display: "this is awesome", documentation: `
    some docs
    over
    many
    many li

    lines
    long
    so
    long
    that
    it
    should

    start
    to
    scroll
    `, filePath: "some filepath"
    });
    docView.show();
}
