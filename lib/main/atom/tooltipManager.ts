///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=atomUtils
import atomUtils = require('./atomUtils'); ///ts:import:generated
///ts:import=parent
import parent = require('../../worker/parent'); ///ts:import:generated

import path = require('path');
import fs = require('fs');
import ts = require('typescript');
import emissary = require('emissary');
var Subscriber = emissary.Subscriber;
import tooltipView = require('./views/tooltipView');
import TooltipView = tooltipView.TooltipView;

export function attach(editorView: any) {
    // Only on ".ts" files
    var editor: AtomCore.IEditor = editorView.editor;
    var filePath = editor.getPath();
    var filename = path.basename(filePath);
    var ext = path.extname(filename);
    if (ext !== '.ts') return;

    // We only create a "program" once the file is persisted to disk
    if (!fs.existsSync(filePath)) {
        return;
    }

    var scroll = editorView.find('.scroll-view');
    var subscriber = new Subscriber();
    var exprTypeTimeout = null;
    var exprTypeTooltip: TooltipView = null;
    subscriber.subscribe(scroll, 'mousemove',(e) => {
        clearExprTypeTimeout();
        exprTypeTimeout = setTimeout(() => showExpressionType(e), 100);
    });
    subscriber.subscribe(scroll, 'mouseout',(e) => clearExprTypeTimeout());


    // Setup for clearing
    subscriber.subscribe(editorView, 'editor:will-be-removed',() => deactivate());

    function showExpressionType(e: MouseEvent) {

        // If we are already showing we should wait for that to clear
        if (exprTypeTooltip) return;

        var pixelPt = pixelPositionFromMouseEvent(editorView, e);
        var screenPt = editor.screenPositionForPixelPosition(pixelPt);
        var bufferPt = editor.bufferPositionForScreenPosition(screenPt);
        var curCharPixelPt = editor.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column]);
        var nextCharPixelPt = editor.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column + 1]);

        if (curCharPixelPt.left >= nextCharPixelPt.left) return;

        // find out show position
        var offset = editorView.lineHeight * 0.7;
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
                var message = `<b>${resp.name}</b>`;
                if (resp.comment) message = message + `<br/><i>${resp.comment}</i>`;
                // Sorry about this "if". It's in the code I copied so I guess its there for a reason
                if (exprTypeTooltip) exprTypeTooltip.updateText(message);
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
    var linesClientRect = editorView.find('.lines')[0].getBoundingClientRect();
    var top = clientY - linesClientRect.top;
    var left = clientX - linesClientRect.left;
    return { top: top, left: left };
}

function screenPositionFromMouseEvent(editorView, event) {
    return editorView.getModel().screenPositionForPixelPosition(pixelPositionFromMouseEvent(editorView, event));
}
