function requestHandler(config) {
    var signatures = config.program.languageService.getSignatureHelpItems(config.filePath, config.position);
    if (!signatures)
        return;
}
exports.requestHandler = requestHandler;
