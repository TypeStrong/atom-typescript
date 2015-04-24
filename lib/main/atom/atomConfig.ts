

// Documentation https://atom.io/docs/api/v0.177.0/Config and http://json-schema.org/examples.html
// To add a new setting you need to add to
//    schema
//    getter/setter

var packageName = 'atom-typescript';
function getConfig<T>(name: string): T {
    return atom.config.get(packageName + '.' + name);
}

class Config {
    schema = {
        debugAtomTs: {
            title: 'Debug: Atom-TypeScript. Please do not use.',
            type: 'boolean',
            default: false
        },
        modulePathToProjectRoot: {
            title: 'Show module path suggestion relative to project root.',
            type: 'boolean',
            default: true
        },
        preferredQuoteCharacter: {
            title: 'Preferred quote character',
            type: 'string',
            default: 'none'
        }
    }
    get debugAtomTs() { return getConfig<boolean>('debugAtomTs') }
    get modulePathToProjectRoot() { return getConfig<string>('modulePathToProjectRoot') }
    get preferredQuoteCharacter() { return getConfig<string>('preferredQuoteCharacter') }
}
var config = new Config();
export = config;
