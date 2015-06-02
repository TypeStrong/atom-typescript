import * as atomUtils from "../atomUtils";

export function showForCurrentEditor() {
    var ed = atomUtils.getActiveEditor();

    showForEditor(ed);
}

export function showForEditor(ed: AtomCore.IEditor) {
    // atom.notifications.addInfo('Semantic view coming soon');
     
    
}


import * as sp from "atom-space-pen-views";
import {ScrollView} from "./view";

class FileSemanticView extends ScrollView<{ editor: AtomCore.IEditor }> {
    stopChangingListener: AtomCore.Disposable;
    destroyListener: AtomCore.Disposable;

    constructor(options) {
        super(options);
    }

    init() {
        this.stopChangingListener = this.options.editor.onDidStopChanging(() => {
            // TODO: update the view
        });
        
        // TODO: observe the scrolling as well
        
        this.destroyListener = this.options.editor.onDidDestroy(()=>{
            this.destroyListener.dispose();
            this.stopChangingListener.dispose();
        });
    }
}