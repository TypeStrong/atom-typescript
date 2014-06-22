import Promise = require('bluebird');

/**
 * A service allowing to retrieve typescript errors
 */
interface IErrorService {
    /**
     * Retrieve a list of errors for a given file
     * @param fileName the absolute path of the file 
     * 
     * @return a promise resolving to a list of errors
     */
    getErrorsForFile(fileName: string): Promise<{ errors: brackets.LintingError[];  aborted: boolean }>
}

export = IErrorService;
