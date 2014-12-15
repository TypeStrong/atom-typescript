'use strict';
var Type = {
    ERROR: 'problem_type_error',
    WARNING: 'problem_type_warning',
    META: 'problem_type_meta'
};
var ErrorService = (function () {
    function ErrorService(projectManager) {
        this.projectManager = projectManager;
    }
    ErrorService.prototype.getErrorsForFile = function (fileName) {
        var _this = this;
        return this.projectManager.getProjectForFile(fileName).then(function (project) {
            var languageService = project.getLanguageService(), syntacticDiagnostics = languageService.getSyntacticDiagnostics(fileName), errors = _this.diagnosticToError(syntacticDiagnostics);
            if (errors.length === 0) {
                var semanticDiagnostic = languageService.getSemanticDiagnostics(fileName);
                errors = _this.diagnosticToError(semanticDiagnostic);
            }
            return {
                errors: errors,
                aborted: false
            };
        }).catch(function () {
            return {
                errors: [],
                aborted: false
            };
        });
    };
    ErrorService.prototype.diagnosticToError = function (diagnostics) {
        if (!diagnostics) {
            return [];
        }
        return diagnostics.map(function (diagnostic) {
            var info = diagnostic.info(), type;
            switch (info.category) {
                case 1 /* Error */:
                    type = Type.ERROR;
                    break;
                case 0 /* Warning */:
                    type = Type.WARNING;
                    break;
                case 3 /* NoPrefix */:
                    type = Type.ERROR;
                    break;
                case 2 /* Message */:
                    type = Type.META;
                    break;
            }
            return {
                pos: {
                    line: diagnostic.line(),
                    ch: diagnostic.character()
                },
                endpos: {
                    line: diagnostic.line(),
                    ch: diagnostic.character() + diagnostic.length()
                },
                message: diagnostic.message(),
                type: type
            };
        });
    };
    return ErrorService;
})();
module.exports = ErrorService;
