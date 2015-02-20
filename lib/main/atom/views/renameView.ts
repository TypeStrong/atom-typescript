import view = require('./view');
var $ = view.$;

export class RenameView extends view.View {

    private something: JQuery;
    static content() {
        return this.div({ class: 'awesome' },
            () => this.div({ class: 'dude', outlet: 'something' })
            );
    }

    constructor(options?: any) {
        super();
    }

    initialize() {
        this.something.html('<div>tada</div>');
    }
}

export var panelView: RenameView;
export var panel: AtomCore.Panel;
export function attach() {
    panelView = new RenameView();
    panel = atom.workspace.addModalPanel({ item: panelView, priority: 1000, visible: false });
}
