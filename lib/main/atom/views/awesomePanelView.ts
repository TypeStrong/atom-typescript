import view = require('./view');
var $ = view.$;

export class AwesomePanelView extends view.View {

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

export var panelView: AwesomePanelView;
export var panel: AtomCore.Panel;
export function attach() {
    panelView = new AwesomePanelView();
    panel = atom.workspace.addModalPanel({ item: view, priority: 1000, visible: false });

    /*setInterval(() => {
        panel.isVisible() ? panel.hide() : panel.show();
        console.log('called');
    }, 1000);*/

}
