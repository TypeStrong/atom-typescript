import atomConfig = require("../atomConfig");
import atomUtils = require("../atomUtils");
import {uriForPath} from "../atomUtils";
import * as sp from "atom-space-pen-views";
import * as view from "./view";
import React = require('react');

interface Props {
    config: SemanticViewConfig
}
interface State {
}

class MyComponent extends React.Component<Props, State>{
    state = {};
    constructor(props: Props) {
        super(props);
    }

    _editor: AtomCore.IEditor;
    set editor(value: AtomCore.IEditor) {
        this._editor = value
        this.forceUpdate();
    }
    get editor() {
        return this._editor;
    }
    componentDidMount() {
        // We listen to a few things

        // Editor scrolling
        var editorScrolling: AtomCore.Disposable;
        // Editor changing
        var editorChanging: AtomCore.Disposable;

        let subscribeToEditor = (editor: AtomCore.IEditor) => {
            this.editor = editor;
            // Subscribe to stop changing
            // Subscribe to stop scrolling

            if (atomConfig.showSemanticView) {
                panel.show();
            }
        }

        let unsubscribeToEditor = () => {
            panel.hide();
            if (!this.editor) return;

            this.setState({ editor: undefined });
        }

        if (atomUtils.isActiveEditorOnDiskAndTs()) {
            subscribeToEditor(atomUtils.getActiveEditor());
        }

        // Tab changing
        atom.workspace.onDidChangeActivePaneItem((editor: AtomCore.IEditor) => {
            if (atomUtils.onDiskAndTs(editor) && atomConfig.showSemanticView) {
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
            {this.editor ? this.editor.getPath() : ""}
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
    }

    /**
     * This function exists because the react component needs access to `panel` which needs access to `SemanticView`.
     * So we lazily create react component after panel creation
     */
    start() {
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
    mainView.start();
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
