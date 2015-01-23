var MessagePanelView = require('atom-message-panel').MessagePanelView, LineMessageView = require('atom-message-panel').LineMessageView;
var messagePanel;
function start() {
    messagePanel = new MessagePanelView({
        title: 'TypeScript'
    });
    messagePanel.attach();
}
exports.start = start;
