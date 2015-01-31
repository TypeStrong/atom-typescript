function requestHandler(config) {
    try {
        console.log(require('views/tooltip-view'));
    }
    catch (ex) {
        console.error(ex);
    }
    var signatures = config.program.languageService.getSignatureHelpItems(config.filePath, config.position);
    if (!signatures)
        return;
}
exports.requestHandler = requestHandler;
