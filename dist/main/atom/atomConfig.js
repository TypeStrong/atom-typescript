"use strict";
const utils_1 = require("../lang/utils");
var packageName = 'atom-typescript';
function getConfig(nameLambda) {
    return atom.config.get(packageName + '.' + utils_1.getName(nameLambda));
}
function setConfig(nameLambda, value) {
    return atom.config.set(packageName + '.' + utils_1.getName(nameLambda), value);
}
class Config {
    constructor() {
        this.schema = {
            preferredQuoteCharacter: {
                title: 'Preferred quote character',
                type: 'string',
                default: 'none'
            },
            typescriptServices: {
                title: 'Full path (including file name) to a custom `typescriptServices.js`',
                type: 'string',
                default: ''
            },
            showSemanticView: {
                title: 'Show semantic view',
                type: 'boolean',
                default: false
            }
        };
    }
    get preferredQuoteCharacter() { return getConfig(() => this.schema.preferredQuoteCharacter); }
    get typescriptServices() { return getConfig(() => this.schema.typescriptServices); }
    get showSemanticView() { return getConfig(() => this.schema.showSemanticView); }
    set showSemanticView(value) { setConfig(() => this.schema.showSemanticView, value); }
}
var config = new Config();
module.exports = config;
