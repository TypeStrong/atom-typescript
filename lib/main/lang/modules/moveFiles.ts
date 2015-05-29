/**
 * Gets the refactorings you would need if you move files around
 */

import {Refactoring} from "../fixmyts/quickFix";
import {getSourceFileImportsWithTextRange} from "../fixmyts/astUtils";
import * as path from "path";
import {
removeExt,
pathIsRelative,
makeRelativePath
} from "../../tsconfig/tsconfig";
import {consistentPath} from "../../utils/fsUtil";

/**
  * will return the refactorings for what needs to change in the source files if the old path becomes new path
  */
export function getRenameFilesRefactorings(program: ts.Program, oldDirectoryOrFile: string, newDirectoryOrFile: string): Refactoring[] {
    oldDirectoryOrFile = consistentPath(oldDirectoryOrFile);
    newDirectoryOrFile = consistentPath(newDirectoryOrFile);

    var oldFileNoExt = removeExt(oldDirectoryOrFile);
    var newFileNoExt = removeExt(newDirectoryOrFile);

    /**
     * Go through all the files in the program and find the ones that referece the "oldDirectoryOrFile"
     * The refactoring is to just find a relative path to the newDirectoryOrFile (just the contents of the string without quotes)
     */

    var refactorings: Refactoring[] = [];

    var sourceFiles = program.getSourceFiles();

    sourceFiles.forEach(sourceFile => {
        let imports = getSourceFileImportsWithTextRange(sourceFile)
            .filter((fileReference) => pathIsRelative(fileReference.text))
            .map(ref=> {
            return {
                path: consistentPath(path.resolve(path.dirname(sourceFile.fileName), ref.text)),
                range: ref.range
            };
        })
        var matches = imports.filter(f=> f.path == oldFileNoExt);
        if (matches.length) {
            for (let match of matches) {
                refactorings.push({
                    filePath: sourceFile.fileName,
                    span: {
                        start: match.range.pos,
                        length: match.range.end - match.range.pos
                    },
                    newText: makeRelativePath(path.dirname(sourceFile.fileName), newFileNoExt)
                });
            }
        }
    });

    return refactorings;
}
