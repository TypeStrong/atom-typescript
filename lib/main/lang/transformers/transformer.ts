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
    
    /** Stuff we will provide for you
     * So you don't need to *implement* it explicitly
     */
    regex?: RegExp;
}

export interface FileTransformationDetails {
    transforms: TransformerDelimiter[];
}

export interface TransformerDelimiter {
    /** .tst file */
    srcMinChar: number;
    srcLimChar: number;
    
    /** .tst.ts file */
    destMinChar: number;
    destLimChar: number;
    
    /** which transformer did this */
    transformer: Transformer;
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
 * Reliably get a file that will be on the file system
 * If the file is a pseudo file
 * , then return the .tst file 
 * otherwise just return the filePath as is
 */
export function getTransformerFile(filePath: string) {
    if (endsWith(filePath, '.tst.ts')) {
        filePath = removeExt(filePath);
    }
    return filePath;
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

function removeExt(filePath: string) {
    return filePath && filePath.substr(0, filePath.lastIndexOf('.'));
}
