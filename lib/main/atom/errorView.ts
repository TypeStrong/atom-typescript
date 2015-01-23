///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated



var MessagePanelView = require('atom-message-panel').MessagePanelView,
    LineMessageView = require('atom-message-panel').LineMessageView;


var messagePanel;
export function start() {
    messagePanel = new MessagePanelView({
        title: 'TypeScript'
    });
    messagePanel.attach();
}
