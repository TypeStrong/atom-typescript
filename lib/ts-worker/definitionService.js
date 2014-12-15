'use strict';
var DefinitionService = (function () {
    function DefinitionService(projectManager) {
        this.projectManager = projectManager;
    }
    DefinitionService.prototype.getDefinitionForFile = function (fileName, position) {
        return this.projectManager.getProjectForFile(fileName).then(function (project) {
            var languageService = project.getLanguageService(), languageServiceHost = project.getLanguageServiceHost(), index = languageServiceHost.getIndexFromPos(fileName, position);
            if (index < 0) {
                return [];
            }
            return languageService.getDefinitionAtPosition(fileName, index).map(function (definition) {
                var startPos = languageServiceHost.indexToPosition(definition.fileName, definition.minChar), endPos = languageServiceHost.indexToPosition(definition.fileName, definition.limChar);
                return {
                    name: (definition.containerName ? (definition.containerName + '.') : '') + definition.name,
                    lineStart: startPos.line,
                    charStart: startPos.ch,
                    lineEnd: endPos.line,
                    charEnd: endPos.ch,
                    fileName: definition.fileName
                };
            });
        }).catch(function () { return []; });
    };
    return DefinitionService;
})();
module.exports = DefinitionService;
