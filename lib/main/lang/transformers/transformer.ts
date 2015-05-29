import * as path from "path";
import * as sourceMap from "source-map";

export interface TransformResult {
    code: string;
    /** Source map */
    map?: sourceMap.SourceMapGenerator;
}

/** Must be implemented by a transformer */
export interface Transformer {
    /** The name we register by */
    name: string;

    transform(code: string): { code: string; };
}



export interface AtomTSTokens { tokens: any /* Atom's Token */[]; ruleStack: any[] }

/** Is this file something that needs to be transformed */
export function isTransformerFile(filePath: string) {
    var ext = path.extname(filePath);
    return ext == '.tst';
}

/** 
 * If this is a file that needs to be transformed ... 
 * then returns the path of the pseudo ts file 
 * else returns filePath as is
 */
export function getPseudoFilePath(filePath: string) {
    if (isTransformerFile(filePath)) {
        return getPseudoTsFile(filePath);
    }
    return filePath;
}

function getPseudoTsFile(filePath: string) {
    return filePath + '.ts';
}

/** 
 * A raw file is something that we create in memory stripping out 
 * any transform locations to get the TS language service 
 * to parse the file out for us for free. 
 * This allows us to create fancier transformers that can use the surrounding AST / typechecker 
 */
export function isRawFile(filePath: string) {
    return endsWith(filePath, ".raw.ts");
}

/**
 * We transform the `.tst` file into a `.tst.ts` file in memory and feed it to the language service
 */
export function isPseudoFile(filePath: string) {
    var ext = path.extname(filePath);
    return endsWith(filePath, ".tst.ts");
}

function endsWith(str: string, suffix: string): boolean {
    return str && str.indexOf(suffix, str.length - suffix.length) !== -1;
}
