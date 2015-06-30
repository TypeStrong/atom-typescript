// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow



///ts:import=atomUtils
import atomUtils = require('./atomUtils'); ///ts:import:generated
///ts:import=parent
import parent = require('../../worker/parent'); ///ts:import:generated

import path = require('path');
import fs = require('fs');
import emissary = require('emissary');
var Subscriber = emissary.Subscriber;
import tooltipView = require('./views/tooltipView');
import TooltipView = tooltipView.TooltipView;
import {$} from "atom-space-pen-views";
import escape = require('escape-html');

export function getFromShadowDom(element: JQuery, selector: string): JQuery {
    var el = element[0];
    var found = (<any> el).rootElement.querySelectorAll(selector);
    return $(found[0]);
}

export function attach(editorView: JQuery, editor: AtomCore.IEditor) {
    var rawView: any = editorView[0];

    // Only on ".ts" files
    var filePath = editor.getPath();
    var filename = path.basename(filePath);
    var ext = path.extname(filename);
    if (!atomUtils.isAllowedExtension(ext)) return;

    // We only create a "program" once the file is persisted to disk
    if (!fs.existsSync(filePath)) {
        return;
    }

    var scroll = getFromShadowDom(editorView, '.scroll-view');
    var subscriber = new Subscriber();
    var exprTypeTimeout = null;
    var exprTypeTooltip: TooltipView = null;

    // to debounce mousemove event's firing for some reason on some machines
    var lastExprTypeBufferPt: any;

    subscriber.subscribe(scroll, 'mousemove', (e) => {
        var pixelPt = pixelPositionFromMouseEvent(editorView, e)
        var screenPt = editor.screenPositionForPixelPosition(pixelPt)
        var bufferPt = editor.bufferPositionForScreenPosition(screenPt)
        if (lastExprTypeBufferPt && lastExprTypeBufferPt.isEqual(bufferPt) && exprTypeTooltip)
            return;

        lastExprTypeBufferPt = bufferPt;

        clearExprTypeTimeout();
        exprTypeTimeout = setTimeout(() => showExpressionType(e), 100);
    });
    subscriber.subscribe(scroll, 'mouseout', (e) => clearExprTypeTimeout());
    subscriber.subscribe(scroll, 'keydown', (e) => clearExprTypeTimeout());

    // Setup for clearing
    editor.onDidDestroy(() => deactivate());

    function showExpressionType(e: MouseEvent) {

        // If we are already showing we should wait for that to clear
        if (exprTypeTooltip) return;

        var pixelPt = pixelPositionFromMouseEvent(editorView, e);
        pixelPt.top += editor.displayBuffer.getScrollTop();
        pixelPt.left += editor.displayBuffer.getScrollLeft();
        var screenPt = editor.screenPositionForPixelPosition(pixelPt);
        var bufferPt = editor.bufferPositionForScreenPosition(screenPt);
        var curCharPixelPt = rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column]);
        var nextCharPixelPt = rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column + 1]);

        if (curCharPixelPt.left >= nextCharPixelPt.left) return;

        // find out show position
        var offset = (<any>editor).getLineHeightInPixels() * 0.7;
        var tooltipRect = {
            left: e.clientX,
            right: e.clientX,
            top: e.clientY - offset,
            bottom: e.clientY + offset
        };
        exprTypeTooltip = new TooltipView(tooltipRect);

        var position = atomUtils.getEditorPositionForBufferPosition(editor, bufferPt);

        // Actually make the program manager query
        parent.quickInfo({ filePath, position }).then((resp) => {
            if (!resp.valid) {
                hideExpressionType();
            }
            else {
                var message = `<b>${escape(resp.name) }</b>`;
                if (resp.comment) {
                    message = message + `<br/><i>${escape(resp.comment).replace(/(?:\r\n|\r|\n)/g, '<br />') }</i>`;
                }
                // Sorry about this "if". It's in the code I copied so I guess its there for a reason
                if (exprTypeTooltip) {
                    exprTypeTooltip.updateText(message);
                }
            }
        });
    }


    function deactivate() {
        subscriber.unsubscribe();
        clearExprTypeTimeout();
    }
    /** clears the timeout && the tooltip */
    function clearExprTypeTimeout() {
        if (exprTypeTimeout) {
            clearTimeout(exprTypeTimeout);
            exprTypeTimeout = null;
        }
        hideExpressionType();
    }
    function hideExpressionType() {
        if (!exprTypeTooltip) return;
        exprTypeTooltip.$.remove();
        exprTypeTooltip = null;
    }
}


function pixelPositionFromMouseEvent(editorView, event: MouseEvent) {
    var clientX = event.clientX, clientY = event.clientY;
    var linesClientRect = getFromShadowDom(editorView, '.lines')[0].getBoundingClientRect();
    var top = clientY - linesClientRect.top;
    var left = clientX - linesClientRect.left;
    return { top: top, left: left };
}

function screenPositionFromMouseEvent(editorView, event) {
    return editorView.getModel().screenPositionForPixelPosition(pixelPositionFromMouseEvent(editorView, event));
}
