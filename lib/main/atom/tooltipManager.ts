// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow

import atomUtils = require('./utils'); ///ts:import:generated
import {clientResolver} from "../atomts"

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
    if (!filePath) {
      return;
    }
    var filename = path.basename(filePath);
    var ext = path.extname(filename);
    if (!atomUtils.isAllowedExtension(ext)) return;

    // We only create a "program" once the file is persisted to disk
    if (!fs.existsSync(filePath)) {
        return;
    }

    var clientPromise = clientResolver.get(filePath)
    var scroll = getFromShadowDom(editorView, '.scroll-view');
    var subscriber = new Subscriber();
    var exprTypeTimeout: any | undefined;
    var exprTypeTooltip: TooltipView | undefined;

    // to debounce mousemove event's firing for some reason on some machines
    var lastExprTypeBufferPt: any;

    subscriber.subscribe(scroll, 'mousemove', (e: MouseEvent) => {
        var pixelPt = pixelPositionFromMouseEvent(editorView, e)
        var screenPt = editor.element.screenPositionForPixelPosition(pixelPt)
        var bufferPt = editor.bufferPositionForScreenPosition(screenPt)
        if (lastExprTypeBufferPt && lastExprTypeBufferPt.isEqual(bufferPt) && exprTypeTooltip)
            return;

        lastExprTypeBufferPt = bufferPt;

        clearExprTypeTimeout();
        exprTypeTimeout = setTimeout(() => showExpressionType(e), 100);
    });
    subscriber.subscribe(scroll, 'mouseout', () => clearExprTypeTimeout());
    subscriber.subscribe(scroll, 'keydown', () => clearExprTypeTimeout());

    // Setup for clearing
    editor.onDidDestroy(() => deactivate());

    async function showExpressionType(e: MouseEvent) {

        // If we are already showing we should wait for that to clear
        if (exprTypeTooltip) return;

        var pixelPt = pixelPositionFromMouseEvent(editorView, e);
        pixelPt.top += editor.element.getScrollTop();
        pixelPt.left += editor.element.getScrollLeft();
        var screenPt = editor.element.screenPositionForPixelPosition(pixelPt);
        var bufferPt = editor.bufferPositionForScreenPosition(screenPt);
        var curCharPixelPt = rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column]);
        var nextCharPixelPt = rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column + 1]);

        if (curCharPixelPt.left >= nextCharPixelPt.left) return;

        // find out show position
        var offset = editor.getLineHeightInPixels() * 0.7;
        var tooltipRect = {
            left: e.clientX,
            right: e.clientX,
            top: e.clientY - offset,
            bottom: e.clientY + offset
        };
        exprTypeTooltip = new TooltipView(tooltipRect);

        const client = await clientPromise
        const result = await client.executeQuickInfo({
            file: filePath,
            line: bufferPt.row+1,
            offset: bufferPt.column+1
        }).catch(err => undefined)

        if (!result) {
          return
        }

        const {displayString, documentation} = result.body!

        var message = `<b>${escape(displayString) }</b>`;
        if (documentation) {
            message = message + `<br/><i>${escape(documentation).replace(/(?:\r\n|\r|\n)/g, '<br />') }</i>`;
        }
        if (exprTypeTooltip) {
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
        exprTypeTooltip.$.remove();
        exprTypeTooltip = undefined;
    }
}


function pixelPositionFromMouseEvent(editorView: JQuery, event: MouseEvent) {
    var clientX = event.clientX, clientY = event.clientY;
    var linesClientRect = getFromShadowDom(editorView, '.lines')[0].getBoundingClientRect();
    var top = clientY - linesClientRect.top;
    var left = clientX - linesClientRect.left;
    return { top: top, left: left };
}
