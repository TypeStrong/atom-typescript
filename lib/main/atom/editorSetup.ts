/**
 * Setup all the stuff we need from an editor instance and clear on editor close
 */
import {debounce} from "../lang/utils";
import * as parent from "../../worker/parent";
import * as atomUtils from "./atomUtils";

export function setupEditor(editor: AtomCore.IEditor) {

    // Quick fix decoration stuff
    var quickFixDecoration: AtomCore.Decoration = null;
    var quickFixMarker: any = null;
    function clearExistingQuickfixDecoration() {
        if (quickFixDecoration) {
            quickFixDecoration.destroy();
            quickFixDecoration = null;
        }
        if(quickFixMarker){
            quickFixMarker.destroy();
            quickFixMarker = null;
        }
    }
    var queryForQuickFix = debounce((filePathPosition) => {
        parent.getQuickFixes(filePathPosition).then(res=> {
            clearExistingQuickfixDecoration();
            if (res.fixes.length) {
                quickFixMarker = editor.markBufferRange(editor.getSelectedBufferRange());
                quickFixDecoration = editor.decorateMarker(quickFixMarker,
                    { type: "gutter", class: "quickfix" });
            }
        })
    }, 500);
    var cursorObserver = editor.onDidChangeCursorPosition(() => {
        queryForQuickFix(atomUtils.getFilePathPosition());
    });


    /**
     * On final dispose
     */
     var destroyObserver = editor.onDidDestroy(() => {
         // Clear editor observers
         cursorObserver.dispose();
         destroyObserver.dispose();
     });
}
