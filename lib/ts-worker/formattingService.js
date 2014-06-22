'use strict';
var FormattingService = (function () {
    function FormattingService(projectManager) {
        this.projectManager = projectManager;
    }
    FormattingService.prototype.getFormatingForFile = function (fileName, options, startPos, endPos) {
        return this.projectManager.getProjectForFile(fileName).then(function (project) {
            var languageServiceHost = project.getLanguageServiceHost(), languageService = project.getLanguageService(), minChar, limChar;

            if (!startPos || !endPos) {
                minChar = 0;
                limChar = project.getLanguageServiceHost().getScriptContent(fileName).length - 1;
            } else {
                minChar = languageServiceHost.getIndexFromPos(fileName, startPos);
                limChar = languageServiceHost.getIndexFromPos(fileName, endPos);
            }

            var result = languageService.getFormattingEditsForRange(fileName, minChar, limChar, options);

            return result && result.reverse();
        });
    };
    return FormattingService;
})();

module.exports = FormattingService;
