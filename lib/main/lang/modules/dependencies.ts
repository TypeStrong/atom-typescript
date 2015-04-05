
import {TypeScriptProjectFileDetails, pathIsRelative, consistentPath} from "../../tsconfig/tsconfig";
import tsconfig = require("../../tsconfig/tsconfig");
import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";

export default function getDependencies(projectFile: TypeScriptProjectFileDetails, program: ts.Program): FileDependency[] {
    var links: FileDependency[] = [];
    var projectDir = projectFile.projectFileDirectory;
    for (let file of program.getSourceFiles()) {
        var content = file.getText();
        var filePath = file.fileName;
        var preProcessedFileInfo = ts.preProcessFile(content, true),
            dir = path.dirname(filePath);

        var targets = preProcessedFileInfo.importedFiles
            .filter((fileReference) => pathIsRelative(fileReference.fileName))
            .map(fileReference => {
            var file = path.resolve(dir, fileReference.fileName + '.ts');
            if (!fs.existsSync(file)) {
                file = path.resolve(dir, fileReference.fileName + '.d.ts');
            }
            return file;
        })

        for (let target of targets) {
            var targetPath = consistentPath(path.relative(projectDir, consistentPath(target)));
            var sourcePath = consistentPath(path.relative(projectDir, filePath));
            links.push({
                sourcePath,
                targetPath
            })
        }
    }
    return links;
}
