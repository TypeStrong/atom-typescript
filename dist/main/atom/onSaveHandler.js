///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated
var parent = require('../../worker/parent');
var errorView = require('./errorView');
function handle(event) {
    var textUpdated = parent.updateText({
        filePath: event.filePath,
        text: event.editor.getText()
    });
    parent.getProjectFileDetails({
        filePath: event.filePath
    }).then(function (fileDetails) {
        if (!fileDetails.project.compileOnSave)
            return;
        textUpdated.then(function () {
            return parent.emitFile({
                filePath: event.filePath
            });
        }).then(function (res) {
            return errorView.showEmittedMessage(res);
        });
    });
}
exports.handle = handle;
