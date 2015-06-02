import utils = require("../utils");
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

var transformFinderRegex = /transform:(.*){/g
var transformEndFinderRegexGenerator = (name: string) => new RegExp(`}transform:${name}`);
export function getInitialTransformation(code: string): FileTransformationDetails {


    var transforms: TransformerDelimiter[] = [];
    var processedSrcUpto = 0;
    var srcCode = code;
    var destCode = '';
    var destDelta = 0;

    while (true) {
        let remainingCode = code.substr(processedSrcUpto);
        // Get the next transform that exist in this file: 
        var matches = transformFinderRegex.exec(remainingCode);
        // No more transforms:
        if (!matches || !matches.length || matches.length < 2) return { transforms };
        // Found one!
        var nextTransformName = matches.slice[1];
        // Update the processedUpto
    }
        
    /**
     * TODO: for each transform we note down the src start and src end
     * Then we transform the src code. This gives a dest start (initially same as src start) and dest end (more or less) 
     * we use this to additionally compute a running (delta) in dest. This delta is used in the next (dest start).
     */


    return { transforms };
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