import atomConfig = require("../atomConfig");
import atomUtils = require("../atomUtils");
import {uriForPath} from "../atomUtils";
import * as sp from "atom-space-pen-views";
import * as view from "./view";
import React = require('react');

interface Props {
    config: SemanticViewConfig
}
interface State { }

class MyComponent extends React.Component<Props, State>{
    state = {};
    constructor(props: Props) {
        super(props);
    }

    currentEditor: AtomCore.IEditor;
    componentDidMount() {
        // We listen to a few things

        // Editor scrolling
        var editorScrolling: AtomCore.Disposable;
        // Editor changing
        var editorChanging: AtomCore.Disposable;

        let subscribeToEditor = (editor: AtomCore.IEditor) => {
            this.currentEditor = editor;
            // Subscribe to stop changing
            // Subscribe to stop scrolling
            this.forceUpdate();

            panel.show();
        }

        let unsubscribeToEditor = () => {
            if (!this.currentEditor) return;

            this.currentEditor = undefined;
            panel.hide();
        }

        if (atomUtils.isActiveEditorOnDiskAndTs()) {
            subscribeToEditor(atomUtils.getActiveEditor());
        }

        // Tab changing
        atom.workspace.onDidChangeActivePaneItem((editor: AtomCore.IEditor) => {
            if (atomUtils.onDiskAndTs(editor)) {
                subscribeToEditor(editor);
            }
            else {
                unsubscribeToEditor();
            }
        });
    }

    /**
     * Actually component will never unmount ... so no unsubs for now
     */
    componentWillUnmount() {
    }
    render() {
        return <div>
            Current editor: <br/>
            {this.currentEditor ? this.currentEditor.getPath() : ""}
            </div>;
    }
}


export interface SemanticViewConfig {
    editor: AtomCore.IEditor
}
export class SemanticView extends view.View<any> {

    public mainContent: JQuery;
    public get rootDomElement() {
        return this.mainContent[0];
    }
    static content() {
        return this.div({ class: 'atomts-semantic-view native-key-bindings' }, () => {
            this.div({ outlet: 'mainContent' });
        });
    }

    constructor(public config) {
        super(config);
        React.render(React.createElement(MyComponent, {}), this.rootDomElement);
    }
}



export var mainView: SemanticView;
var panel: AtomCore.Panel;
export function attach() {

    // Only attach once
    if (mainView) {
        return;
    }

    mainView = new SemanticView({});
    panel = atom.workspace.addRightPanel({ item: mainView, priority: 1000, visible: atomConfig.showSemanticView && atomUtils.isActiveEditorOnDiskAndTs() });
}

export function toggle() {
    if (panel.isVisible()) {
        atomConfig.showSemanticView = (false);
        panel.hide();
    } else {
        atomConfig.showSemanticView = (true);
        panel.show();
    }
}
