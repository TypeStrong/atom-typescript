import view = require('./view');
var $ = view.$;
var html = require('../../../../views/renameView.html');

interface EditorViewzz extends JQuery {
    model: AtomCore.IEditor;
}

interface RenameViewOptions {
    autoSelect: boolean;
    title: string;
    text: string;
    onCommit?: (newValue: string) => any;
    onCancel?: () => any;
    /** A truthy string return indicates a validation error */
    onValidate: (newValue: string) => string;
}

export class RenameView extends view.View<RenameViewOptions> {

    private newNameEditor: EditorViewzz;
    private validationMessage: JQuery;
    private panel: AtomCore.Panel;
    private title: JQuery;
    static content = html;

    public init() {
        $(atom.views.getView(atom.workspace)).on('keydown', (e) => {
            if (e.keyCode == 27) { // escape
                if (this.options.onCancel) {
                    this.options.onCancel();
                    this.clearView();
                }
            }
        });

        this.newNameEditor.on('keydown', (e) => {
            var newText = this.newNameEditor.model.getText();
            if (e.keyCode == 13) { // enter
                var invalid = this.options.onValidate(newText);
                if (invalid) {
                    this.validationMessage.text(invalid);
                    this.validationMessage.show();
                    return;
                }
                this.validationMessage.hide();

                if (this.options.onCommit) {
                    this.options.onCommit(newText);
                    this.clearView();
                }
            }
            if (e.keyCode == 27) { // escape
                if (this.options.onCancel) {
                    this.options.onCancel();
                    this.clearView();
                }
            }
        });
    }

    public setPanel(panel: AtomCore.Panel) {
      this.panel = panel
    }

    public editorAtRenameStart?: AtomCore.IEditor;
    public clearView() {
        if (this.editorAtRenameStart && !this.editorAtRenameStart.isDestroyed()) {
            var view = atom.views.getView(this.editorAtRenameStart);
            view.focus();
        }
        this.panel.hide();
        this.options = <any>{};
        this.editorAtRenameStart = undefined;
    }

    private renameThis(options: RenameViewOptions) {
        this.options = options;
        this.editorAtRenameStart = atom.workspace.getActiveTextEditor();
        this.panel.show();

        this.newNameEditor.model.setText(options.text);
        if (this.options.autoSelect) {
            this.newNameEditor.model.selectAll();
        }
        else {
            this.newNameEditor.model.moveCursorToEndOfScreenLine();
        }
        this.title.text(this.options.title);
        this.newNameEditor.focus();

        this.validationMessage.hide();
    }

    // Show the dialog and resolve the promise with the entered string
    showRenameDialog(options: RenameViewOptions): Promise<string> {
      return new Promise((resolve, reject) => {
        this.renameThis({
          ...options,
          onCancel: reject,
          onCommit: resolve
        })
      })
    }
}

export function attach(): {dispose(): void, renameView: RenameView} {
    const renameView = new RenameView(<any>{});
    const panel = atom.workspace.addModalPanel({
      item: renameView,
      priority: 1000,
      visible: false
    })

    renameView.setPanel(panel)

    return {
      dispose() {
        console.log("TODO: Detach the rename view: ", panel)
      },
      renameView
    }
}
