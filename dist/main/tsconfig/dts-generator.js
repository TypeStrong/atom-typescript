var pathUtil = require("path");
var os = require("os");
var fs = require("fs");
var mkdirp = require("mkdirp");
function consistentPath(filePath) {
    return filePath.split('\\').join('/');
}
function getError(diagnostics) {
    var message = 'Declaration generation failed';
    diagnostics.forEach(function (diagnostic) {
        var position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        message +=
            ("\n" + diagnostic.file.fileName + "(" + (position.line + 1) + "," + (position.character + 1) + "): ") +
                ("error TS" + diagnostic.code + ": " + diagnostic.messageText);
    });
    var error = new Error(message);
    error.name = 'EmitterError';
    return error;
}
function makeRelativePath(relativeFolder, filePath) {
    var relativePath = pathUtil.relative(relativeFolder, filePath).split('\\').join('/');
    if (relativePath[0] !== '.') {
        relativePath = './' + relativePath;
    }
    return relativePath;
}
function getFilenames(baseDir, files) {
    return files.map(function (filename) {
        var resolvedFilename = pathUtil.resolve(filename);
        if (resolvedFilename.indexOf(baseDir) === 0) {
            return resolvedFilename;
        }
        return pathUtil.resolve(baseDir, filename);
    });
}
function processTree(sourceFile, replacer) {
    var code = '';
    var cursorPosition = 0;
    function skip(node) {
        cursorPosition = node.end;
    }
    function readThrough(node) {
        code += sourceFile.text.slice(cursorPosition, node.pos);
        cursorPosition = node.pos;
    }
    function visit(node) {
        readThrough(node);
        var replacement = replacer(node);
        if (replacement != null) {
            code += replacement;
            skip(node);
        }
        else {
            ts.forEachChild(node, visit);
        }
    }
    visit(sourceFile);
    code += sourceFile.text.slice(cursorPosition);
    return code;
}
function generate(options, sendMessage) {
    if (sendMessage === void 0) { sendMessage = function () { }; }
    var baseDir = pathUtil.resolve(options.baseDir);
    var eol = options.eol || os.EOL;
    var nonEmptyLineStart = new RegExp(eol + '(?!' + eol + '|$)', 'g');
    var indent = options.indent === undefined ? '\t' : options.indent;
    var target = options.target || ts.ScriptTarget.Latest;
    var compilerOptions = {
        declaration: true,
        module: ts.ModuleKind.CommonJS,
        target: target
    };
    if (options.outDir) {
        compilerOptions.outDir = options.outDir;
    }
    var filenames = getFilenames(baseDir, options.files);
    var excludesMap = {};
    options.excludes && options.excludes.forEach(function (filename) {
        excludesMap[consistentPath(pathUtil.resolve(baseDir, filename))] = true;
    });
    var externsMap = {};
    options.externs && options.externs.forEach(function (filename) {
        externsMap[consistentPath(pathUtil.resolve(baseDir, filename))] = true;
    });
    mkdirp.sync(pathUtil.dirname(options.out));
    var output = fs.createWriteStream(options.out, { mode: parseInt('644', 8) });
    var host = ts.createCompilerHost(compilerOptions);
    var program = ts.createProgram(filenames, compilerOptions, host);
    var checker = ts.createTypeChecker(program, true);
    function writeFile(filename, data, writeByteOrderMark) {
        if (filename.slice(-5) !== '.d.ts') {
            return;
        }
        writeDeclaration(ts.createSourceFile(filename, data, target, true));
    }
    return new Promise(function (resolve, reject) {
        output.on('close', function () { resolve(undefined); });
        output.on('error', reject);
        if (options.externs) {
            var relativeRoot = pathUtil.dirname(options.out);
            options.externs.forEach(function (path) {
                sendMessage("Writing external dependency " + path);
                output.write("/// <reference path=\"" + makeRelativePath(relativeRoot, path) + "\" />" + eol);
            });
        }
        program.getSourceFiles().some(function (sourceFile) {
            if (pathUtil.normalize(sourceFile.fileName).indexOf(baseDir) !== 0) {
                return;
            }
            if (excludesMap[sourceFile.fileName]) {
                return;
            }
            if (externsMap[sourceFile.fileName]) {
                return;
            }
            sendMessage("Processing " + sourceFile.fileName);
            if (sourceFile.fileName.slice(-5) === '.d.ts') {
                writeDeclaration(sourceFile);
                return;
            }
            var emitOutput = program.emit(sourceFile, writeFile);
            if (emitOutput.emitSkipped) {
                reject(getError(emitOutput.diagnostics
                    .concat(program.getSemanticDiagnostics(sourceFile))
                    .concat(program.getSyntacticDiagnostics(sourceFile))
                    .concat(program.getDeclarationDiagnostics(sourceFile))));
                return true;
            }
        });
        if (options.main) {
            output.write(("declare module '" + options.name + "' {") + eol + indent);
            output.write(("import main = require('" + options.main + "');") + eol + indent);
            output.write('export = main;' + eol);
            output.write('}' + eol);
            sendMessage("Aliased main module " + options.name + " to " + options.main);
        }
        output.end();
    });
    function writeDeclaration(declarationFile) {
        var filename = declarationFile.fileName;
        var sourceModuleId = options.name + consistentPath(filename.slice(baseDir.length, -5));
        if (declarationFile.externalModuleIndicator) {
            output.write('declare module \'' + sourceModuleId + '\' {' + eol + indent);
            var content = processTree(declarationFile, function (node) {
                if (node.kind === ts.SyntaxKind.ExternalModuleReference) {
                    var expression = node.expression;
                    if (expression.text.charAt(0) === '.') {
                        return ' require(\'' + pathUtil.join(pathUtil.dirname(sourceModuleId), expression.text) + '\')';
                    }
                }
                else if (node.kind === ts.SyntaxKind.DeclareKeyword) {
                    return '';
                }
                else if (node.kind === ts.SyntaxKind.StringLiteral &&
                    (node.parent.kind === ts.SyntaxKind.ExportDeclaration
                        || node.parent.kind === ts.SyntaxKind.ImportDeclaration)) {
                    var text = node.text;
                    if (text.charAt(0) === '.') {
                        return " '" + consistentPath(pathUtil.join(pathUtil.dirname(sourceModuleId), text)) + "'";
                    }
                }
            });
            output.write(content.replace(nonEmptyLineStart, '$&' + indent));
            output.write(eol + '}' + eol);
        }
        else {
            output.write(declarationFile.text);
        }
    }
}
exports.generate = generate;
