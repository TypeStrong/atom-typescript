import {Transformer, TransformerDelimiter, FileTransformationDetails} from "./transformer";

/**
 * Transformers should push themeselves into this registry. 
 * This is so that the registry does not depend on the transformers
 * As that will cause a circular reference
 */
var allTransformers: Transformer[] = [
];

export function add(transformer: Transformer) {
    transformer.regex = (new RegExp(`transform:${transformer.name}{[.\\s]*}transform:${transformer.name}`, 'g'));
    allTransformers.push(transformer);
}

/** Returns the name of the added transformers */
export function getNames() {
    return allTransformers.map(at=> at.name);
}

/** Returns the regexes for all the added transformers */
export function getRegexes() {
    return allTransformers.map(at=> at.regex);
}

export function getInitialTransformation(code: string): FileTransformationDetails {
    

    return {
        transforms: []
    };
}

export function transform(name: string, code: string): { code: string } {
    var transformer = allTransformers.filter(at => at.name == name)[0];

    if (!transformer) {
        console.error('No transformer registered with name: ', name);
        return { code: '' };
    }

    return transformer.transform(code);
}

// Ensure that all the transformers are loaded: 
// Since nothing depends on these explicitly (don't want a circular ref)
// We need to load them manually:
import * as path from "path";
var expand = require('glob-expand');
let files: string[] = expand({ filter: 'isFile', cwd: __dirname }, [
    "./implementations/*.js"
]);
files = files.map(f=> require(f));