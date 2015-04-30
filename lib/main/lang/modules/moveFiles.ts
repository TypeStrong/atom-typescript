/**
 * Gets the refactorings you would need if you move files around
 */

import {Refactoring} from "../fixmyts/quickFix";
import {getSourceFileImports} from "../fixmyts/astUtils";
import * as path from "path";
import {
removeExt,
consistentPath,
pathIsRelative,
makeRelativePath
} from "../../tsconfig/tsconfig";

/**
  * will return the refactorings for what needs to change in the source files if the old path becomes new path
  */
export function getRenameFilesRefactorings(program: ts.Program, oldDirectoryOrFile: string, newDirectoryOrFile: string): Refactoring[] {
    oldDirectoryOrFile = consistentPath(oldDirectoryOrFile);
    newDirectoryOrFile = consistentPath(newDirectoryOrFile);

    var oldFileNoExt = removeExt(oldDirectoryOrFile);

    /**
     * Go through all the files in the program and find the ones that referece the "oldDirectoryOrFile"
     * The refactoring is to just find a relative path to the newDirectoryOrFile (just the contents of the string without quotes)
     */

    var refactorings: Refactoring[] = [];

    var sourceFiles = program.getSourceFiles();

    sourceFiles.forEach(sourceFile => {
        let imports = getSourceFileImports(sourceFile)
            .filter((fileReference) => pathIsRelative(fileReference))
            .map(ref=> consistentPath(path.resolve(path.dirname(sourceFile.fileName), ref)))
        var matches = imports.filter(f=> f == oldFileNoExt);
        if (matches.length) {
            for (let match of matches) {

            }
        }
    });

    return refactorings;
}
