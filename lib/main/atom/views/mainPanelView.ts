import view = require('./view');
var $ = view.$;

import lineMessageView = require('./lineMessageView');

export class MainPanelView extends view.View<any> {

    private btnFold: JQuery;
    private body: JQuery;
    private summary: JQuery;
    private heading: JQuery;
    static content() {
        return this.div({
            class: 'am-panel tool-panel panel-bottom native-key-bindings',
            tabindex: '-1'
        },() => {
                this.div({
                    class: 'panel-resize-handle',
                    style: 'position: absolute; top: 0; left: 0; right: 0; height: 10px; cursor: row-resize; z-index: 3'
                });
                this.div({
                    class: 'panel-heading'
                },() => {
                        this.div({
                            class: 'heading-title inline-block',
                            style: 'cursor: pointer',
                            outlet: 'heading',
                            click: 'toggle'
                        });
                        this.div({
                            class: 'heading-summary',
                            style: 'display:inline-block',
                            outlet: 'summary'
                        });
                        this.div({
                            class: 'heading-buttoms inline-block pull-right'
                        },() => {
                                this.div({
                                    class: 'heading-fold inline-block icon-fold',
                                    style: 'cursor: pointer',
                                    outlet: 'btnFold',
                                    click: 'toggle'
                                });
                            });
                    });
                this.div({
                    class: 'panel-body atomts-panel-body padded',
                    outlet: 'body',
                    style: 'overflow-y: auto; display:none'
                });
            });
    }

    init() {
    }

    setTitle(html: string) {
        this.heading.html(html);
    }

    toggle() {
        this.btnFold.toggleClass('icon-fold, icon-unfold');
        this.body.toggle('fast');
        // Because we want to toggle between display:
        // 'none' and 'inline-block' for the summary,
        // we can't use .toggle().
        if (this.summary.css('display') === 'none') {
            this.summary.css('display', 'inline-block');
        } else {
            this.summary.hide();
        }
    }

    private cleared = true;
    clear() {
        this.cleared = true;
        this.body.empty();
    }

    add(view: any /*TODO: Type this*/) {
        if (this.cleared && view.getSummary) {
            // This is the first message, so use it to
            // set the summary
            this.setSummary(view.getSummary());
        }
        this.cleared = false;

        this.body.append(view.$);
    }

    setSummary(summary: any /*TODO: Type this*/) {
        var
            message = summary.summary,
            className = summary.className,
            raw = summary.rawSummary || false,
            handler = summary.handler || undefined;
        // Reset the class-attributes on the old summary
        this.summary.attr('class', 'heading-summary inline-block');
        // Set the new summary
        if (raw) {
            this.summary.html(message);
        } else {
            this.summary.text(message);
        }
        if (className) {
            this.summary.addClass(className);
        }
        if (handler) {
            handler(this.summary);
        }
    }
}

export var panelView: MainPanelView;
var panel: AtomCore.Panel;
export function attach() {
    
    // Only attach once
    if (panelView) return;

    panelView = new MainPanelView();
    panel = atom.workspace.addBottomPanel({ item: panelView, priority: 1000, visible: true });
}
