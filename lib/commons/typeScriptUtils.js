'use strict';
function validateTypeScriptProjectConfig(config) {
    if (!config) {
        return false;
    }
    if (config.target && ['es3', 'es5'].indexOf(config.target.toLowerCase()) === -1) {
        return false;
    }
    if (config.module && ['none', 'amd', 'commonjs'].indexOf(config.module.toLowerCase()) === -1) {
        return false;
    }
    if (config.sourceRoot && typeof config.sourceRoot !== 'string') {
        return false;
    }
    if (!config.sources || !Array.isArray(config.sources) || !config.sources.every(function (pattern) { return typeof pattern === 'string'; })) {
        return false;
    }
    return true;
}
exports.validateTypeScriptProjectConfig = validateTypeScriptProjectConfig;
exports.typeScriptProjectConfigDefault = {
    noLib: false,
    target: 'es3',
    module: 'none',
    noImplicitAny: false
};
