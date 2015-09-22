import project = require('../core/project');
import mkdirp = require('mkdirp');
import path = require('path');
import fs = require('fs');
import {pathIsRelative, makeRelativePath} from "../../tsconfig/tsconfig";
import {consistentPath} from "../../utils/fsUtil";
import {createMap, assign} from "../utils";

/** Lazy loaded babel tanspiler */
let babel: any;

/** If we get a compile request for a ts file that is not in project. We return a js file with the following content */
export const Not_In_Context = "/* NotInContext */";

export function diagnosticToTSError(diagnostic: ts.Diagnostic): CodeError {
    var filePath = diagnostic.file.fileName;
    var startPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    var endPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start + diagnostic.length);

    return {
        filePath: filePath,
        startPos: { line: startPosition.line, col: startPosition.character },
        endPos: { line: endPosition.line, col: endPosition.character },
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        preview: diagnostic.file.text.substr(diagnostic.start, diagnostic.length),
    };
}

export function emitFile(proj: project.Project, filePath: string): EmitOutput {
    var services = proj.languageService;
    var output = services.getEmitOutput(filePath);
    var emitDone = !output.emitSkipped;
    var errors: CodeError[] = [];

    let sourceFile = services.getSourceFile(filePath);

    // Emit is no guarantee that there are no errors
    // so lets collect those
    var allDiagnostics = services.getCompilerOptionsDiagnostics()
        .concat(services.getSyntacticDiagnostics(filePath))
        .concat(services.getSemanticDiagnostics(filePath));
    allDiagnostics.forEach(diagnostic => {
        // happens only for 'lib.d.ts' for some reason
        if (!diagnostic.file) return;

        var startPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        errors.push(diagnosticToTSError(diagnostic));
    });

    /**
     * Run an external transpiler
     */
    {
        let sourceMapContents: { [index: string]: any } = {};
        output.outputFiles.forEach(o => {
            mkdirp.sync(path.dirname(o.name));
            let additionalEmits = runExternalTranspiler(
                filePath,
                sourceFile.text,
                o,
                proj,
                sourceMapContents
            );

            if (!sourceMapContents[o.name] && !proj.projectFile.project.compilerOptions.noEmit) {
                // .js.map files will be written as an "additional emit" later.
                fs.writeFileSync(o.name, o.text, "utf8");
            }

            additionalEmits.forEach(a => {
                mkdirp.sync(path.dirname(a.name));
                fs.writeFileSync(a.name, a.text, "utf8");
            })
        });
    }

    // There is no *official* emit output for a `d.ts`
    // but its nice to have a consistent world view in the rest of our code
    var outputFiles = output.outputFiles.map((o) => o.name);
    if (path.extname(filePath) == '.d.ts') {
        outputFiles.push(filePath);
    }

    return {
        sourceFileName: filePath,
        outputFiles: outputFiles,
        success: emitDone && !errors.length,
        errors: errors,
        emitError: !emitDone
    };
}
export function getRawOutput(proj: project.Project, filePath: string): ts.EmitOutput {
    let services = proj.languageService;
    let output: ts.EmitOutput;
    if (proj.includesSourceFile(filePath)) {
        output = services.getEmitOutput(filePath);
    } else {
        output = {
            outputFiles: [{ name: filePath, text: Not_In_Context, writeByteOrderMark: false }],
            emitSkipped: true
        }
    }
    return output;
}

function runExternalTranspiler(sourceFileName: string,
    sourceFileText: string,
    outputFile: ts.OutputFile,
    project: project.Project,
    sourceMapContents: { [index: string]: any }): ts.OutputFile[] {

    if (!isJSFile(outputFile.name) && !isJSSourceMapFile(outputFile.name)) {
        return [];
    }

    let settings = project.projectFile.project;
    let externalTranspiler = settings.externalTranspiler;
    if (!externalTranspiler) {
        return [];
    }

    if (isJSSourceMapFile(outputFile.name)) {
        let sourceMapPayload = JSON.parse(outputFile.text);
        let jsFileName = consistentPath(path.resolve(path.dirname(outputFile.name), sourceMapPayload.file));
        sourceMapContents[outputFile.name] = { jsFileName: jsFileName, sourceMapPayload };
        return [];
    }

    if (typeof externalTranspiler === 'string') {
        externalTranspiler = {
            name: externalTranspiler as string,
            options: {}
        }
    }

    // We need this type guard to narrow externalTranspiler's type
    if (typeof externalTranspiler === 'object') {
        if (externalTranspiler.name.toLocaleLowerCase() === "babel") {
            if (!babel) {
                babel = require("babel")
            }

            let babelOptions: any = assign({}, externalTranspiler.options || {}, {
                filename: outputFile.name
            });

            let sourceMapFileName = getJSMapNameForJSFile(outputFile.name);

            if (sourceMapContents[sourceMapFileName]) {
                babelOptions.inputSourceMap = sourceMapContents[sourceMapFileName].sourceMapPayload;
                let baseName = path.basename(sourceFileName);
                // NOTE: Babel generates invalid source map without consistent `sources` and `file`.
                babelOptions.inputSourceMap.sources = [baseName];
                babelOptions.inputSourceMap.file = baseName;
            }
            if (settings.compilerOptions.sourceMap) {
                babelOptions.sourceMaps = true;
            }
            if (settings.compilerOptions.inlineSourceMap) {
                babelOptions.sourceMaps = "inline";
            }
            if (!settings.compilerOptions.removeComments) {
                babelOptions.comments = true;
            }

            let babelResult = babel.transform(outputFile.text, babelOptions);
            outputFile.text = babelResult.code;

            if (babelResult.map && settings.compilerOptions.sourceMap) {
                let additionalEmit: ts.OutputFile = {
                    name: sourceMapFileName,
                    text: JSON.stringify(babelResult.map),
                    writeByteOrderMark: settings.compilerOptions.emitBOM
                };

                if (additionalEmit.name === "") {
                    // can't emit a blank file name - this should only be reached if the TypeScript
                    // language service returns the .js file before the .js.map file.
                    console.warn(`The TypeScript language service did not yet provide a .js.map name for file ${outputFile.name}`);
                    return [];
                }

                return [additionalEmit];
            }

            return [];
        }
    }

    function getJSMapNameForJSFile(jsFileName: string) {
        for (let jsMapName in sourceMapContents) {
            if (sourceMapContents.hasOwnProperty(jsMapName)) {
                if (sourceMapContents[jsMapName].jsFileName === jsFileName) {
                    return jsMapName;
                }
            }
        }
        return "";
    }
}

function isJSFile(fileName: string) {
    return (path.extname(fileName).toLocaleLowerCase() === ".js");
}

function isJSSourceMapFile(fileName: string) {
    let lastExt = path.extname(fileName);
    if (lastExt === ".map") {
        return isJSFile(fileName.substr(0, fileName.length - 4));
    }
    return false;
}


import dts = require("../../tsconfig/dts-generator");

export function emitDts(proj: project.Project) {

    if (!proj.projectFile.project) return;
    if (proj.projectFile.project.compilerOptions.out) return;
    if (!proj.projectFile.project.package) return;
    if (!proj.projectFile.project.package.directory) return;
    if (!proj.projectFile.project.package.definition) return;

    // Determined from package.json typescript.definition property
    var outFile = path.resolve(proj.projectFile.project.package.directory, './', proj.projectFile.project.package.definition)

    // This is package.json directory
    var baseDir = proj.projectFile.project.package.directory;

    // The name of the package (of course!)
    var name = proj.projectFile.project.package.name;

    // The main file
    var main: string = proj.projectFile.project.package.main;

    // We need to find a ts file for this `main` and we also need to get its
    if (main) {
        // if path is relative we need to replace that section with 'name'
        // ./foo => 'something/foo'
        main = name + '/' + consistentPath(main.replace('./', ''));

        // Replace trailing `.js` with nothing
        main = main.replace(/\.*.js$/g, '');
    }

    // Typings become externs
    // And these are relative to the output .d.ts we are generating
    var externs = proj.projectFile.project.typings;

    // The files
    var files = proj.projectFile.project.files;

    dts.generate({
        baseDir,
        files,
        externs,
        name: name,

        target: proj.projectFile.project.compilerOptions.target,
        out: outFile,

        main: main,

        outDir: proj.projectFile.project.compilerOptions.outDir
    })
}
