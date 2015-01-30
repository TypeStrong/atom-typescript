///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=programManager
import programManager = require('../lang/programManager'); ///ts:import:generated

import path = require('path');
var Subscriber = require('emissary').Subscriber;
var TooltipView: { new (rect: any): IToolTipView; } = require('../views/tooltip-view').TooltipView;

interface IToolTipView {
    updateText(text: string);

    // Methods from base View
    remove();
}

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
    var exprTypeTooltip: IToolTipView = null;
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

        // Actually make the program manager query
        var position = program.languageServiceHost.getIndexFromPosition(filePath, { line: bufferPt.row, ch: bufferPt.column });
        var definition = program.languageService.getDefinitionAtPosition(filePath, position);
        console.log(definition);
        if (!definition || !definition.length) {
            exprTypeTooltip.updateText('any');
        } else {
            var message = definition.map((d) => {
                return `<b>(${d.kind}) ${d.name} </b>
                <br/><span class='icon icon-file-text'>${d.fileName}</span>
                `
            }).join('<br/><br/>');
            exprTypeTooltip.updateText(message);
        }
    }


    function deactivate() {
        subscriber.unsubscribe();
        clearExprTypeTimeout();
    }
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
