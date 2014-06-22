'use strict';
var LexicalStructureService = (function () {
    function LexicalStructureService(projectManager) {
        this.projectManager = projectManager;
    }
    LexicalStructureService.prototype.getLexicalStructureForFile = function (fileName) {
        return this.projectManager.getProjectForFile(fileName).then(function (project) {
            var languageServiceHost = project.getLanguageServiceHost();
            var items = project.getLanguageService().getScriptLexicalStructure(fileName) || [];
            return items.map(function (item) {
                return ({
                    name: item.name,
                    containerName: item.containerName,
                    position: languageServiceHost.indexToPosition(fileName, item.minChar)
                });
            });
        });
    };
    return LexicalStructureService;
})();

module.exports = LexicalStructureService;
