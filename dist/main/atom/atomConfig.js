// Documentation https://atom.io/docs/api/v0.177.0/Config and http://json-schema.org/examples.html
// To add a new setting you need to add to
//    schema
//    getter/setter
var packageName = 'atom-typescript';
function getConfig(name) {
    return atom.config.get(packageName + '.' + name);
}
var Config = (function () {
    function Config() {
        this.schema = {
            debugAtomTs: {
                title: 'Debug: Atom-TypeScript. Please do not use.',
                type: 'boolean',
                default: false
            },
            preferredQuoteCharacter: {
                title: 'Preferred quote character',
                type: 'string',
                default: 'none'
            },
        };
    }
    Object.defineProperty(Config.prototype, "debugAtomTs", {
        get: function () { return getConfig('debugAtomTs'); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Config.prototype, "preferredQuoteCharacter", {
        get: function () { return getConfig('preferredQuoteCharacter'); },
        enumerable: true,
        configurable: true
    });
    return Config;
})();
var config = new Config();
module.exports = config;
