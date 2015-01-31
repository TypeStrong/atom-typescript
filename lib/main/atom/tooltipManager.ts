///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=programManager
import programManager = require('../lang/programManager'); ///ts:import:generated
///ts:import=atomUtils
import atomUtils = require('./atomUtils'); ///ts:import:generated

import path = require('path');
import ts = require('typescript');
import emissary = require('emissary');
var Subscriber = emissary.Subscriber;
import tooltipView = require('views/tooltip-view');

export function attach(editorView: any) {
    // Only on ".ts" files
    var editor: AtomCore.IEditor = editorView.editor;
    var filePath = editor.getPath();
    var filename = path.basename(filePath);
    var ext = path.extname(filename);
    if (ext !== '.ts') return;

    var program = programManager.getOrCreateProgram(filePath);

    var scroll = editorView.find('.scroll-view');
    var subscriber = new Subscriber();
    var exprTypeTimeout = null;
    var exprTypeTooltip: tooltipView.ITooltipView = null;
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
        exprTypeTooltip = new tooltipView.TooltipView(tooltipRect);

        // Actually make the program manager query
        var position = atomUtils.getEditorPositionForBufferPosition(editor,bufferPt);
        var info = program.languageService.getQuickInfoAtPosition(filePath, position);
        if (!info) {
            hideExpressionType();
        } else {
            var displayName = ts.displayPartsToString(info.displayParts || []);
            var documentation = ts.displayPartsToString(info.documentation || []);
            var message = `<b>${displayName}</b>`;
            if(documentation) message = message + `<br/><i>${documentation}</i>`;
            exprTypeTooltip.updateText(message);
        }
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
        exprTypeTooltip.remove();
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
