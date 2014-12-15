'use strict';
var BRACKETS_CONFIG_FILE_NAME = '.brackets.json';
function isBracketsPreferenceFile(path) {
    return path && path.substr(path.lastIndexOf('/') + 1, path.length) === BRACKETS_CONFIG_FILE_NAME;
}
var Type = {
    ERROR: 'problem_type_error',
    WARNING: 'problem_type_warning',
    META: 'problem_type_meta'
};
var TypeScriptConfigErrorReporter = (function () {
    function TypeScriptConfigErrorReporter() {
        this.name = 'TypeScript Configuration';
    }
    TypeScriptConfigErrorReporter.prototype.scanFile = function (content, path) {
        if (!isBracketsPreferenceFile(path)) {
            return null;
        }
        var data;
        try {
            data = JSON.parse(content);
        }
        catch (e) {
            return {
                errors: [],
                aborted: true
            };
        }
        var typescript = data.typescript;
        if (!data.typescript) {
            return {
                errors: [],
                aborted: false
            };
        }
        var errors = [];
        if (typescript.projects && typescript.sources) {
            errors.push('You cannot have sources and projects at the same level');
        }
        validateSection(null, typescript, !typescript.projects, errors);
        if (typescript.projects) {
            if (typeof typescript.projects !== 'object') {
                errors.push('invalid section projects, it must be an object');
            }
            Object.keys(typescript.projects).forEach(function (key) {
                validateSection(key + ': ', typescript.projects[key], true, errors);
            });
        }
        return {
            errors: errors.map(function (message) { return ({
                message: message,
                type: Type.ERROR,
                pos: { line: -1, ch: -1 }
            }); }),
            aborted: false
        };
    };
    return TypeScriptConfigErrorReporter;
})();
function validateSection(sectionName, config, mustHaveSources, errors) {
    var prefix = sectionName ? sectionName + ': ' : '';
    if (config.target && ['es3', 'es5'].indexOf(config.target.toLowerCase()) === -1) {
        errors.push(prefix + 'the target section has invalid value authorized values are \'es3\' or \'es5\'');
    }
    if (config.module && ['none', 'amd', 'commonjs'].indexOf(config.module.toLowerCase()) === -1) {
        errors.push(prefix + 'the module section has invalid value authorized values are \'none\', \'amd\' or \'commonjs\'');
    }
    if (config.sourceRoot && typeof config.sourceRoot !== 'string') {
        errors.push(prefix + 'the sourceRoot section must be a string');
    }
    if (mustHaveSources) {
        if (!config.sources || !Array.isArray(config.sources) || !config.sources.every(function (pattern) { return typeof pattern === 'string'; })) {
            errors.push(prefix + 'invalid sources section it must be an array of string');
        }
    }
}
module.exports = TypeScriptConfigErrorReporter;
