import * as path from "path";
import * as sourceMap from "source-map";

export interface TransformResult{
    code:string;
    /** Source map */
    map: sourceMap.SourceMapGenerator;
}

/** Must be implemented by a transformer */
export interface Transformer {
    transform(code:string): {code:string;};
    
    /** This is going to be called from the UI thread */
    tokenizeLine?(line: string, ruleStack: any[], firstLine?:boolean): AtomTSTokens;
}



export interface AtomTSTokens { tokens: any /* Atom's Token */[]; ruleStack: any[] }

/** Is this file something that needs to be transformed */
export function isTransformerFile(filePath: string) {
    var ext = path.extname(filePath);
    return ext == '.tst';
}

/** 
 * A raw file is something that we create in memory stripping out 
 * any transform locations to get the TS language service 
 * to parse the file out for us for free. 
 * This allows us to create fancier transformers that can use the surrounding AST / typechecker 
 */
export function isRawFile(filePath:string){
    return endsWith(filePath, ".raw.ts");
}

/**
 * We transform the `.tst` file into a `.tst.ts` file in memory and feed it to the language service
 */
export function isTransformedFile(filePath: string){ 
    var ext = path.extname(filePath);
    return endsWith(filePath, ".tst.ts");
}

function endsWith(str: string, suffix: string): boolean {
    return str && str.indexOf(suffix, str.length - suffix.length) !== -1;
}
