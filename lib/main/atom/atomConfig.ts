import {getName} from "../lang/utils";

interface IConfig extends AtomCore.IConfig {
  set<T>(keyPath:string, value: T):any;
}
// Documentation https://atom.io/docs/api/v0.177.0/Config and http://json-schema.org/examples.html
// To add a new setting you need to add to
//    schema
//    getter/setter

var packageName = 'atom-typescript';
function getConfig<T>(nameLambda: () => any): T {
    return atom.config.get(packageName + '.' + getName(nameLambda));
}
function setConfig<T>(nameLambda: () => any, value: T): T {
    return (atom.config as IConfig).set(packageName + '.' + getName(nameLambda), value);
}

class Config {
    schema = {
        showSemanticView: {
            title: 'Show semantic view',
            type: 'boolean',
            default: false
        }
    }
    get showSemanticView() { return getConfig<boolean>(() => {return this.schema.showSemanticView;}) }
    set showSemanticView(value: boolean) { setConfig<boolean>(() => {return this.schema.showSemanticView;}, value) }
}
var config = new Config();
export = config;
