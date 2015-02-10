var atomConfig = require('./atomConfig');
var parent = require('../../worker/parent');
var errorView = require('./errorView');
function handle(event) {
    var textUpdated = parent.updateText({ filePath: event.filePath, text: event.editor.getText() });
    if (atomConfig.compileOnSave) {
        textUpdated.then(function () { return parent.emitFile({ filePath: event.filePath }); }).then(function (res) { return errorView.showEmittedMessage(res); });
    }
}
exports.handle = handle;
