import {getName} from "../lang/utils";

// Documentation https://atom.io/docs/api/v0.177.0/Config and http://json-schema.org/examples.html
// To add a new setting you need to add to
//    schema
//    getter/setter

var packageName = 'atom-typescript';
function getConfig<T>(nameLambda: () => any): T {
    return atom.config.get(packageName + '.' + getName(nameLambda));
}
function setConfig<T>(nameLambda: () => any, value: T): T {
    return atom.config.set(packageName + '.' + getName(nameLambda), value);
}

class Config {
    schema = {
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
    }
    get debugAtomTs() { return getConfig<boolean>(() => this.schema.debugAtomTs) }
    get preferredQuoteCharacter() { return getConfig<string>(() => this.schema.preferredQuoteCharacter) }
    get typescriptServices() { return getConfig<string>(() => this.schema.typescriptServices) }
    get showSemanticView() { return getConfig<boolean>(() => this.schema.showSemanticView) }
    set showSemanticView(value: boolean) { setConfig<boolean>(() => this.schema.showSemanticView, value) }
}
var config = new Config();
export = config;
