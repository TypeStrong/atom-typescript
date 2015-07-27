var atomUtils = require("./atomUtils");
var parent = require('../../worker/parent');
var mainPanelView_1 = require("./views/mainPanelView");
var fileStatusCache_1 = require("./fileStatusCache");
function handle(event) {
    var textUpdated = parent.updateText({ filePath: event.filePath, text: event.editor.getText() });
    textUpdated.then(function () {
        atomUtils.triggerLinter();
        parent.errorsForFile({ filePath: event.filePath })
            .then(function (resp) { return mainPanelView_1.errorView.setErrors(event.filePath, resp.errors); });
    });
    mainPanelView_1.show();
    parent.getProjectFileDetails({ filePath: event.filePath }).then(function (fileDetails) {
        if (fileDetails.project.compileOnSave
            && !fileDetails.project.compilerOptions.out
            && !fileDetails.project.buildOnSave) {
            textUpdated.then(function () { return parent.emitFile({ filePath: event.filePath }); })
                .then(function (res) {
                var status = fileStatusCache_1.getFileStatus(event.filePath);
                status.modified = false;
                status.emitDiffers = res.emitError;
                mainPanelView_1.panelView.updateFileStatus(event.filePath);
                mainPanelView_1.errorView.showEmittedMessage(res);
            });
        }
        if (fileDetails.project.buildOnSave) {
            atom.commands.dispatch(atom.views.getView(event.editor), 'typescript:build');
        }
    });
}
exports.handle = handle;
