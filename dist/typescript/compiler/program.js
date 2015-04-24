/// <reference path="sys.ts" />
/// <reference path="emitter.ts" />
var ts;
(function (ts) {
    ts.programTime = 0;
    ts.emitTime = 0;
    ts.ioReadTime = 0;
    ts.ioWriteTime = 0;
    ts.version = "1.5.0";
    function findConfigFile(searchPath) {
        var fileName = "tsconfig.json";
        while (true) {
            if (ts.sys.fileExists(fileName)) {
                return fileName;
            }
            var parentPath = ts.getDirectoryPath(searchPath);
            if (parentPath === searchPath) {
                break;
            }
            searchPath = parentPath;
            fileName = "../" + fileName;
        }
        return undefined;
    }
    ts.findConfigFile = findConfigFile;
    function createCompilerHost(options, setParentNodes) {
        var currentDirectory;
        var existingDirectories = {};
        function getCanonicalFileName(fileName) {
            return ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase();
        }
        var unsupportedFileEncodingErrorCode = -2147024809;
        function getSourceFile(fileName, languageVersion, onError) {
            var text;
            try {
                var start = new Date().getTime();
                text = ts.sys.readFile(fileName, options.charset);
                ts.ioReadTime += new Date().getTime() - start;
            }
            catch (e) {
                if (onError) {
                    onError(e.number === unsupportedFileEncodingErrorCode
                        ? ts.createCompilerDiagnostic(ts.Diagnostics.Unsupported_file_encoding).messageText
                        : e.message);
                }
                text = "";
            }
            return text !== undefined ? ts.createSourceFile(fileName, text, languageVersion, setParentNodes) : undefined;
        }
        function directoryExists(directoryPath) {
            if (ts.hasProperty(existingDirectories, directoryPath)) {
                return true;
            }
            if (ts.sys.directoryExists(directoryPath)) {
                existingDirectories[directoryPath] = true;
                return true;
            }
            return false;
        }
        function ensureDirectoriesExist(directoryPath) {
            if (directoryPath.length > ts.getRootLength(directoryPath) && !directoryExists(directoryPath)) {
                var parentDirectory = ts.getDirectoryPath(directoryPath);
                ensureDirectoriesExist(parentDirectory);
                ts.sys.createDirectory(directoryPath);
            }
        }
        function writeFile(fileName, data, writeByteOrderMark, onError) {
            try {
                var start = new Date().getTime();
                ensureDirectoriesExist(ts.getDirectoryPath(ts.normalizePath(fileName)));
                ts.sys.writeFile(fileName, data, writeByteOrderMark);
                ts.ioWriteTime += new Date().getTime() - start;
            }
            catch (e) {
                if (onError) {
                    onError(e.message);
                }
            }
        }
        return {
            getSourceFile: getSourceFile,
            getDefaultLibFileName: function (options) { return ts.combinePaths(ts.getDirectoryPath(ts.normalizePath(ts.sys.getExecutingFilePath())), ts.getDefaultLibFileName(options)); },
            writeFile: writeFile,
            getCurrentDirectory: function () { return currentDirectory || (currentDirectory = ts.sys.getCurrentDirectory()); },
            useCaseSensitiveFileNames: function () { return ts.sys.useCaseSensitiveFileNames; },
            getCanonicalFileName: getCanonicalFileName,
            getNewLine: function () { return ts.sys.newLine; }
        };
    }
    ts.createCompilerHost = createCompilerHost;
    function getPreEmitDiagnostics(program) {
        var diagnostics = program.getSyntacticDiagnostics().concat(program.getGlobalDiagnostics()).concat(program.getSemanticDiagnostics());
        if (program.getCompilerOptions().declaration) {
            diagnostics.concat(program.getDeclarationDiagnostics());
        }
        return ts.sortAndDeduplicateDiagnostics(diagnostics);
    }
    ts.getPreEmitDiagnostics = getPreEmitDiagnostics;
    function flattenDiagnosticMessageText(messageText, newLine) {
        if (typeof messageText === "string") {
            return messageText;
        }
        else {
            var diagnosticChain = messageText;
            var result = "";
            var indent = 0;
            while (diagnosticChain) {
                if (indent) {
                    result += newLine;
                    for (var i = 0; i < indent; i++) {
                        result += "  ";
                    }
                }
                result += diagnosticChain.messageText;
                indent++;
                diagnosticChain = diagnosticChain.next;
            }
            return result;
        }
    }
    ts.flattenDiagnosticMessageText = flattenDiagnosticMessageText;
    function createProgram(rootNames, options, host) {
        var program;
        var files = [];
        var filesByName = {};
        var diagnostics = ts.createDiagnosticCollection();
        var seenNoDefaultLib = options.noLib;
        var commonSourceDirectory;
        var diagnosticsProducingTypeChecker;
        var noDiagnosticsTypeChecker;
        var start = new Date().getTime();
        host = host || createCompilerHost(options);
        ts.forEach(rootNames, function (name) { return processRootFile(name, false); });
        if (!seenNoDefaultLib) {
            processRootFile(host.getDefaultLibFileName(options), true);
        }
        verifyCompilerOptions();
        ts.programTime += new Date().getTime() - start;
        program = {
            getSourceFile: getSourceFile,
            getSourceFiles: function () { return files; },
            getCompilerOptions: function () { return options; },
            getSyntacticDiagnostics: getSyntacticDiagnostics,
            getGlobalDiagnostics: getGlobalDiagnostics,
            getSemanticDiagnostics: getSemanticDiagnostics,
            getDeclarationDiagnostics: getDeclarationDiagnostics,
            getTypeChecker: getTypeChecker,
            getDiagnosticsProducingTypeChecker: getDiagnosticsProducingTypeChecker,
            getCommonSourceDirectory: function () { return commonSourceDirectory; },
            emit: emit,
            getCurrentDirectory: function () { return host.getCurrentDirectory(); },
            getNodeCount: function () { return getDiagnosticsProducingTypeChecker().getNodeCount(); },
            getIdentifierCount: function () { return getDiagnosticsProducingTypeChecker().getIdentifierCount(); },
            getSymbolCount: function () { return getDiagnosticsProducingTypeChecker().getSymbolCount(); },
            getTypeCount: function () { return getDiagnosticsProducingTypeChecker().getTypeCount(); },
        };
        return program;
        function getEmitHost(writeFileCallback) {
            return {
                getCanonicalFileName: function (fileName) { return host.getCanonicalFileName(fileName); },
                getCommonSourceDirectory: program.getCommonSourceDirectory,
                getCompilerOptions: program.getCompilerOptions,
                getCurrentDirectory: function () { return host.getCurrentDirectory(); },
                getNewLine: function () { return host.getNewLine(); },
                getSourceFile: program.getSourceFile,
                getSourceFiles: program.getSourceFiles,
                writeFile: writeFileCallback || (function (fileName, data, writeByteOrderMark, onError) { return host.writeFile(fileName, data, writeByteOrderMark, onError); }),
            };
        }
        function getDiagnosticsProducingTypeChecker() {
            return diagnosticsProducingTypeChecker || (diagnosticsProducingTypeChecker = ts.createTypeChecker(program, true));
        }
        function getTypeChecker() {
            return noDiagnosticsTypeChecker || (noDiagnosticsTypeChecker = ts.createTypeChecker(program, false));
        }
        function emit(sourceFile, writeFileCallback) {
            if (options.noEmitOnError && getPreEmitDiagnostics(this).length > 0) {
                return { diagnostics: [], sourceMaps: undefined, emitSkipped: true };
            }
            var emitResolver = getDiagnosticsProducingTypeChecker().getEmitResolver(sourceFile);
            var start = new Date().getTime();
            var emitResult = ts.emitFiles(emitResolver, getEmitHost(writeFileCallback), sourceFile);
            ts.emitTime += new Date().getTime() - start;
            return emitResult;
        }
        function getSourceFile(fileName) {
            fileName = host.getCanonicalFileName(fileName);
            return ts.hasProperty(filesByName, fileName) ? filesByName[fileName] : undefined;
        }
        function getDiagnosticsHelper(sourceFile, getDiagnostics) {
            if (sourceFile) {
                return getDiagnostics(sourceFile);
            }
            var allDiagnostics = [];
            ts.forEach(program.getSourceFiles(), function (sourceFile) {
                ts.addRange(allDiagnostics, getDiagnostics(sourceFile));
            });
            return ts.sortAndDeduplicateDiagnostics(allDiagnostics);
        }
        function getSyntacticDiagnostics(sourceFile) {
            return getDiagnosticsHelper(sourceFile, getSyntacticDiagnosticsForFile);
        }
        function getSemanticDiagnostics(sourceFile) {
            return getDiagnosticsHelper(sourceFile, getSemanticDiagnosticsForFile);
        }
        function getDeclarationDiagnostics(sourceFile) {
            return getDiagnosticsHelper(sourceFile, getDeclarationDiagnosticsForFile);
        }
        function getSyntacticDiagnosticsForFile(sourceFile) {
            return sourceFile.parseDiagnostics;
        }
        function getSemanticDiagnosticsForFile(sourceFile) {
            var typeChecker = getDiagnosticsProducingTypeChecker();
            ts.Debug.assert(!!sourceFile.bindDiagnostics);
            var bindDiagnostics = sourceFile.bindDiagnostics;
            var checkDiagnostics = typeChecker.getDiagnostics(sourceFile);
            var programDiagnostics = diagnostics.getDiagnostics(sourceFile.fileName);
            return bindDiagnostics.concat(checkDiagnostics).concat(programDiagnostics);
        }
        function getDeclarationDiagnosticsForFile(sourceFile) {
            if (!ts.isDeclarationFile(sourceFile)) {
                var resolver = getDiagnosticsProducingTypeChecker().getEmitResolver(sourceFile);
                var writeFile = function () { };
                return ts.getDeclarationDiagnostics(getEmitHost(writeFile), resolver, sourceFile);
            }
        }
        function getGlobalDiagnostics() {
            var typeChecker = getDiagnosticsProducingTypeChecker();
            var allDiagnostics = [];
            ts.addRange(allDiagnostics, typeChecker.getGlobalDiagnostics());
            ts.addRange(allDiagnostics, diagnostics.getGlobalDiagnostics());
            return ts.sortAndDeduplicateDiagnostics(allDiagnostics);
        }
        function hasExtension(fileName) {
            return ts.getBaseFileName(fileName).indexOf(".") >= 0;
        }
        function processRootFile(fileName, isDefaultLib) {
            processSourceFile(ts.normalizePath(fileName), isDefaultLib);
        }
        function processSourceFile(fileName, isDefaultLib, refFile, refPos, refEnd) {
            var start;
            var length;
            if (refEnd !== undefined && refPos !== undefined) {
                start = refPos;
                length = refEnd - refPos;
            }
            var diagnostic;
            if (hasExtension(fileName)) {
                if (!options.allowNonTsExtensions && !ts.fileExtensionIs(host.getCanonicalFileName(fileName), ".ts")) {
                    diagnostic = ts.Diagnostics.File_0_must_have_extension_ts_or_d_ts;
                }
                else if (!findSourceFile(fileName, isDefaultLib, refFile, refPos, refEnd)) {
                    diagnostic = ts.Diagnostics.File_0_not_found;
                }
                else if (refFile && host.getCanonicalFileName(fileName) === host.getCanonicalFileName(refFile.fileName)) {
                    diagnostic = ts.Diagnostics.A_file_cannot_have_a_reference_to_itself;
                }
            }
            else {
                if (options.allowNonTsExtensions && !findSourceFile(fileName, isDefaultLib, refFile, refPos, refEnd)) {
                    diagnostic = ts.Diagnostics.File_0_not_found;
                }
                else if (!findSourceFile(fileName + ".ts", isDefaultLib, refFile, refPos, refEnd) && !findSourceFile(fileName + ".d.ts", isDefaultLib, refFile, refPos, refEnd)) {
                    diagnostic = ts.Diagnostics.File_0_not_found;
                    fileName += ".ts";
                }
            }
            if (diagnostic) {
                if (refFile) {
                    diagnostics.add(ts.createFileDiagnostic(refFile, start, length, diagnostic, fileName));
                }
                else {
                    diagnostics.add(ts.createCompilerDiagnostic(diagnostic, fileName));
                }
            }
        }
        function findSourceFile(fileName, isDefaultLib, refFile, refStart, refLength) {
            var canonicalName = host.getCanonicalFileName(fileName);
            if (ts.hasProperty(filesByName, canonicalName)) {
                return getSourceFileFromCache(fileName, canonicalName, false);
            }
            else {
                var normalizedAbsolutePath = ts.getNormalizedAbsolutePath(fileName, host.getCurrentDirectory());
                var canonicalAbsolutePath = host.getCanonicalFileName(normalizedAbsolutePath);
                if (ts.hasProperty(filesByName, canonicalAbsolutePath)) {
                    return getSourceFileFromCache(normalizedAbsolutePath, canonicalAbsolutePath, true);
                }
                var file = filesByName[canonicalName] = host.getSourceFile(fileName, options.target, function (hostErrorMessage) {
                    if (refFile) {
                        diagnostics.add(ts.createFileDiagnostic(refFile, refStart, refLength, ts.Diagnostics.Cannot_read_file_0_Colon_1, fileName, hostErrorMessage));
                    }
                    else {
                        diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Cannot_read_file_0_Colon_1, fileName, hostErrorMessage));
                    }
                });
                if (file) {
                    seenNoDefaultLib = seenNoDefaultLib || file.hasNoDefaultLib;
                    filesByName[canonicalAbsolutePath] = file;
                    if (!options.noResolve) {
                        var basePath = ts.getDirectoryPath(fileName);
                        processReferencedFiles(file, basePath);
                        processImportedModules(file, basePath);
                    }
                    if (isDefaultLib) {
                        files.unshift(file);
                    }
                    else {
                        files.push(file);
                    }
                }
                return file;
            }
            function getSourceFileFromCache(fileName, canonicalName, useAbsolutePath) {
                var file = filesByName[canonicalName];
                if (file && host.useCaseSensitiveFileNames()) {
                    var sourceFileName = useAbsolutePath ? ts.getNormalizedAbsolutePath(file.fileName, host.getCurrentDirectory()) : file.fileName;
                    if (canonicalName !== sourceFileName) {
                        diagnostics.add(ts.createFileDiagnostic(refFile, refStart, refLength, ts.Diagnostics.File_name_0_differs_from_already_included_file_name_1_only_in_casing, fileName, sourceFileName));
                    }
                }
                return file;
            }
        }
        function processReferencedFiles(file, basePath) {
            ts.forEach(file.referencedFiles, function (ref) {
                var referencedFileName = ts.isRootedDiskPath(ref.fileName) ? ref.fileName : ts.combinePaths(basePath, ref.fileName);
                processSourceFile(ts.normalizePath(referencedFileName), false, file, ref.pos, ref.end);
            });
        }
        function processImportedModules(file, basePath) {
            ts.forEach(file.statements, function (node) {
                if (node.kind === 209 || node.kind === 208 || node.kind === 215) {
                    var moduleNameExpr = ts.getExternalModuleName(node);
                    if (moduleNameExpr && moduleNameExpr.kind === 8) {
                        var moduleNameText = moduleNameExpr.text;
                        if (moduleNameText) {
                            var searchPath = basePath;
                            while (true) {
                                var searchName = ts.normalizePath(ts.combinePaths(searchPath, moduleNameText));
                                if (findModuleSourceFile(searchName + ".ts", moduleNameExpr) || findModuleSourceFile(searchName + ".d.ts", moduleNameExpr)) {
                                    break;
                                }
                                var parentPath = ts.getDirectoryPath(searchPath);
                                if (parentPath === searchPath) {
                                    break;
                                }
                                searchPath = parentPath;
                            }
                        }
                    }
                }
                else if (node.kind === 205 && node.name.kind === 8 && (node.flags & 2 || ts.isDeclarationFile(file))) {
                    ts.forEachChild(node.body, function (node) {
                        if (ts.isExternalModuleImportEqualsDeclaration(node) &&
                            ts.getExternalModuleImportEqualsDeclarationExpression(node).kind === 8) {
                            var nameLiteral = ts.getExternalModuleImportEqualsDeclarationExpression(node);
                            var moduleName = nameLiteral.text;
                            if (moduleName) {
                                var searchName = ts.normalizePath(ts.combinePaths(basePath, moduleName));
                                var tsFile = findModuleSourceFile(searchName + ".ts", nameLiteral);
                                if (!tsFile) {
                                    findModuleSourceFile(searchName + ".d.ts", nameLiteral);
                                }
                            }
                        }
                    });
                }
            });
            function findModuleSourceFile(fileName, nameLiteral) {
                return findSourceFile(fileName, false, file, nameLiteral.pos, nameLiteral.end - nameLiteral.pos);
            }
        }
        function computeCommonSourceDirectory(sourceFiles) {
            var commonPathComponents;
            var currentDirectory = host.getCurrentDirectory();
            ts.forEach(files, function (sourceFile) {
                if (ts.isDeclarationFile(sourceFile)) {
                    return;
                }
                var sourcePathComponents = ts.getNormalizedPathComponents(sourceFile.fileName, currentDirectory);
                sourcePathComponents.pop();
                if (!commonPathComponents) {
                    commonPathComponents = sourcePathComponents;
                    return;
                }
                for (var i = 0, n = Math.min(commonPathComponents.length, sourcePathComponents.length); i < n; i++) {
                    if (commonPathComponents[i] !== sourcePathComponents[i]) {
                        if (i === 0) {
                            diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Cannot_find_the_common_subdirectory_path_for_the_input_files));
                            return;
                        }
                        commonPathComponents.length = i;
                        break;
                    }
                }
                if (sourcePathComponents.length < commonPathComponents.length) {
                    commonPathComponents.length = sourcePathComponents.length;
                }
            });
            return ts.getNormalizedPathFromPathComponents(commonPathComponents);
        }
        function checkSourceFilesBelongToPath(sourceFiles, rootDirectory) {
            var allFilesBelongToPath = true;
            if (sourceFiles) {
                var currentDirectory = host.getCurrentDirectory();
                var absoluteRootDirectoryPath = host.getCanonicalFileName(ts.getNormalizedAbsolutePath(rootDirectory, currentDirectory));
                for (var _i = 0; _i < sourceFiles.length; _i++) {
                    var sourceFile = sourceFiles[_i];
                    if (!ts.isDeclarationFile(sourceFile)) {
                        var absoluteSourceFilePath = host.getCanonicalFileName(ts.getNormalizedAbsolutePath(sourceFile.fileName, currentDirectory));
                        if (absoluteSourceFilePath.indexOf(absoluteRootDirectoryPath) !== 0) {
                            diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.File_0_is_not_under_rootDir_1_rootDir_is_expected_to_contain_all_source_files, sourceFile.fileName, options.rootDir));
                            allFilesBelongToPath = false;
                        }
                    }
                }
            }
            return allFilesBelongToPath;
        }
        function verifyCompilerOptions() {
            if (options.separateCompilation) {
                if (options.sourceMap) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_sourceMap_cannot_be_specified_with_option_separateCompilation));
                }
                if (options.declaration) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_declaration_cannot_be_specified_with_option_separateCompilation));
                }
                if (options.noEmitOnError) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_noEmitOnError_cannot_be_specified_with_option_separateCompilation));
                }
                if (options.out) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_out_cannot_be_specified_with_option_separateCompilation));
                }
            }
            if (!options.sourceMap && (options.mapRoot || options.sourceRoot)) {
                if (options.mapRoot) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_mapRoot_cannot_be_specified_without_specifying_sourcemap_option));
                }
                if (options.sourceRoot) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_sourceRoot_cannot_be_specified_without_specifying_sourcemap_option));
                }
                return;
            }
            var languageVersion = options.target || 0;
            var firstExternalModuleSourceFile = ts.forEach(files, function (f) { return ts.isExternalModule(f) ? f : undefined; });
            if (options.separateCompilation) {
                if (!options.module && languageVersion < 2) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_separateCompilation_can_only_be_used_when_either_option_module_is_provided_or_option_target_is_ES6_or_higher));
                }
                var firstNonExternalModuleSourceFile = ts.forEach(files, function (f) { return !ts.isExternalModule(f) && !ts.isDeclarationFile(f) ? f : undefined; });
                if (firstNonExternalModuleSourceFile) {
                    var span = ts.getErrorSpanForNode(firstNonExternalModuleSourceFile, firstNonExternalModuleSourceFile);
                    diagnostics.add(ts.createFileDiagnostic(firstNonExternalModuleSourceFile, span.start, span.length, ts.Diagnostics.Cannot_compile_non_external_modules_when_the_separateCompilation_flag_is_provided));
                }
            }
            else if (firstExternalModuleSourceFile && languageVersion < 2 && !options.module) {
                var span = ts.getErrorSpanForNode(firstExternalModuleSourceFile, firstExternalModuleSourceFile.externalModuleIndicator);
                diagnostics.add(ts.createFileDiagnostic(firstExternalModuleSourceFile, span.start, span.length, ts.Diagnostics.Cannot_compile_external_modules_unless_the_module_flag_is_provided));
            }
            if (options.module && languageVersion >= 2) {
                diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Cannot_compile_external_modules_into_amd_commonjs_or_umd_when_targeting_ES6_or_higher));
            }
            if (options.outDir ||
                options.sourceRoot ||
                (options.mapRoot &&
                    (!options.out || firstExternalModuleSourceFile !== undefined))) {
                if (options.rootDir && checkSourceFilesBelongToPath(files, options.rootDir)) {
                    commonSourceDirectory = ts.getNormalizedAbsolutePath(options.rootDir, host.getCurrentDirectory());
                }
                else {
                    commonSourceDirectory = computeCommonSourceDirectory(files);
                }
                if (commonSourceDirectory && commonSourceDirectory[commonSourceDirectory.length - 1] !== ts.directorySeparator) {
                    commonSourceDirectory += ts.directorySeparator;
                }
            }
            if (options.noEmit) {
                if (options.out || options.outDir) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_noEmit_cannot_be_specified_with_option_out_or_outDir));
                }
                if (options.declaration) {
                    diagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_noEmit_cannot_be_specified_with_option_declaration));
                }
            }
        }
    }
    ts.createProgram = createProgram;
})(ts || (ts = {}));
