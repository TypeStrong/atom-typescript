
import {TypeScriptProjectFileDetails, pathIsRelative} from "../../tsconfig/tsconfig";
import {consistentPath} from "../../utils/fsUtil";
import tsconfig = require("../../tsconfig/tsconfig");
import * as path from "path";
import * as fs from "fs";
import {getSourceFileImports} from "../fixmyts/astUtils";

export default function getDependencies(projectFile: TypeScriptProjectFileDetails, program: ts.Program): FileDependency[] {
    var links: FileDependency[] = [];
    var projectDir = projectFile.projectFileDirectory;
    for (let file of program.getSourceFiles()) {
        let filePath = file.fileName;
        var dir = path.dirname(filePath);

        var targets = getSourceFileImports(file)
            .filter((fileReference) => pathIsRelative(fileReference))
            .map(fileReference => {
            var file = path.resolve(dir, fileReference + '.ts');
            if (!fs.existsSync(file)) {
                file = path.resolve(dir, fileReference + '.d.ts');
            }
            return file;
        });

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
