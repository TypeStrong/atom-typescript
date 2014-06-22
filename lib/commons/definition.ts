import Promise = require('bluebird');

/**
 * Represent definition info of a symbol
 */
export interface DefinitionInfo {
    /**
     * full name of the symbol
     */
    name: string;
    
    /**
     * line at which the symbol definition start
     */
    lineStart: number;
    
    /**
     * charachter at which the symbol definition start
     */
    charStart: number;
    
    /**
     * line at which the symbol definition end
     */
    lineEnd: number;
    
    /**
     * charachter at which the symbol definition end
     */
    charEnd: number;
    
    /**
     * path of the file where the symbol is defined
     */
    fileName: string;
}

/**
 * A service allowing to retrieve definition info
 */
export interface IDefinitionService {
    
    /**
     * retrieve definition info of a symbol at a given position in a given file
     * @param fileName the absolute path of the file 
     * @param position in the file where you want to retrieve definition info
     * 
     * @return a promise resolving to a list of definition info
     */
    getDefinitionForFile(fileName: string, position: CodeMirror.Position): Promise<DefinitionInfo[]>;
}
