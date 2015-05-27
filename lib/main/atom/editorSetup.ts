/**
 * Setup all the stuff we need from an editor instance and clear on editor close
 */
import {debounce} from "../lang/utils";
import * as parent from "../../worker/parent";
import * as atomUtils from "./atomUtils";
import {isTransformerFile} from "../lang/transformers/transformer";

export function setupEditor(editor: AtomCore.IEditor) {

    // Quick fix decoration stuff
    var quickFixDecoration: AtomCore.Decoration = null;
    var quickFixMarker: any = null;
    function clearExistingQuickfixDecoration() {
        if (quickFixDecoration) {
            quickFixDecoration.destroy();
            quickFixDecoration = null;
        }
        if (quickFixMarker) {
            quickFixMarker.destroy();
            quickFixMarker = null;
        }
    }
    var queryForQuickFix = debounce((filePathPosition:{filePath:string;position:number}) => {
        parent.getQuickFixes(filePathPosition).then(res=> {
            clearExistingQuickfixDecoration();
            if (res.fixes.length) {
                quickFixMarker = editor.markBufferRange(editor.getSelectedBufferRange());
                quickFixDecoration = editor.decorateMarker(quickFixMarker,
                    { type: "line-number", class: "quickfix" });
            }
        })
    }, 500);
    var cursorObserver = editor.onDidChangeCursorPosition(() => {
        try {
            // This line seems to throw an exception sometimes.             
            // https://github.com/TypeStrong/atom-typescript/issues/325
            // https://github.com/TypeStrong/atom-typescript/issues/310
            let pathPos = atomUtils.getFilePathPosition();
            
            // TODO: implement quickfix logic for transformed files
            if (isTransformerFile(pathPos.filePath)) {
                clearExistingQuickfixDecoration();
                return;
            }

            queryForQuickFix(pathPos);
        }
        catch (ex) {
            clearExistingQuickfixDecoration();
        }
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
