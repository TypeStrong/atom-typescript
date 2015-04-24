/// <reference path="program.ts"/>
/// <reference path="commandLineParser.ts"/>
var ts;
(function (ts) {
    function validateLocaleAndSetLanguage(locale, errors) {
        var matchResult = /^([a-z]+)([_\-]([a-z]+))?$/.exec(locale.toLowerCase());
        if (!matchResult) {
            errors.push(ts.createCompilerDiagnostic(ts.Diagnostics.Locale_must_be_of_the_form_language_or_language_territory_For_example_0_or_1, 'en', 'ja-jp'));
            return false;
        }
        var language = matchResult[1];
        var territory = matchResult[3];
        if (!trySetLanguageAndTerritory(language, territory, errors) &&
            !trySetLanguageAndTerritory(language, undefined, errors)) {
            errors.push(ts.createCompilerDiagnostic(ts.Diagnostics.Unsupported_locale_0, locale));
            return false;
        }
        return true;
    }
    function trySetLanguageAndTerritory(language, territory, errors) {
        var compilerFilePath = ts.normalizePath(ts.sys.getExecutingFilePath());
        var containingDirectoryPath = ts.getDirectoryPath(compilerFilePath);
        var filePath = ts.combinePaths(containingDirectoryPath, language);
        if (territory) {
            filePath = filePath + "-" + territory;
        }
        filePath = ts.sys.resolvePath(ts.combinePaths(filePath, "diagnosticMessages.generated.json"));
        if (!ts.sys.fileExists(filePath)) {
            return false;
        }
        try {
            var fileContents = ts.sys.readFile(filePath);
        }
        catch (e) {
            errors.push(ts.createCompilerDiagnostic(ts.Diagnostics.Unable_to_open_file_0, filePath));
            return false;
        }
        try {
            ts.localizedDiagnosticMessages = JSON.parse(fileContents);
        }
        catch (e) {
            errors.push(ts.createCompilerDiagnostic(ts.Diagnostics.Corrupted_locale_file_0, filePath));
            return false;
        }
        return true;
    }
    function countLines(program) {
        var count = 0;
        ts.forEach(program.getSourceFiles(), function (file) {
            count += ts.getLineStarts(file).length;
        });
        return count;
    }
    function getDiagnosticText(message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var diagnostic = ts.createCompilerDiagnostic.apply(undefined, arguments);
        return diagnostic.messageText;
    }
    function reportDiagnostic(diagnostic) {
        var output = "";
        if (diagnostic.file) {
            var loc = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
            output += diagnostic.file.fileName + "(" + (loc.line + 1) + "," + (loc.character + 1) + "): ";
        }
        var category = ts.DiagnosticCategory[diagnostic.category].toLowerCase();
        output += category + " TS" + diagnostic.code + ": " + ts.flattenDiagnosticMessageText(diagnostic.messageText, ts.sys.newLine) + ts.sys.newLine;
        ts.sys.write(output);
    }
    function reportDiagnostics(diagnostics) {
        for (var i = 0; i < diagnostics.length; i++) {
            reportDiagnostic(diagnostics[i]);
        }
    }
    function padLeft(s, length) {
        while (s.length < length) {
            s = " " + s;
        }
        return s;
    }
    function padRight(s, length) {
        while (s.length < length) {
            s = s + " ";
        }
        return s;
    }
    function reportStatisticalValue(name, value) {
        ts.sys.write(padRight(name + ":", 12) + padLeft(value.toString(), 10) + ts.sys.newLine);
    }
    function reportCountStatistic(name, count) {
        reportStatisticalValue(name, "" + count);
    }
    function reportTimeStatistic(name, time) {
        reportStatisticalValue(name, (time / 1000).toFixed(2) + "s");
    }
    function isJSONSupported() {
        return typeof JSON === "object" && typeof JSON.parse === "function";
    }
    function executeCommandLine(args) {
        var commandLine = ts.parseCommandLine(args);
        var configFileName;
        var configFileWatcher;
        var cachedProgram;
        var rootFileNames;
        var compilerOptions;
        var compilerHost;
        var hostGetSourceFile;
        var timerHandle;
        if (commandLine.options.locale) {
            if (!isJSONSupported()) {
                reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.The_current_host_does_not_support_the_0_option, "--locale"));
                return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
            }
            validateLocaleAndSetLanguage(commandLine.options.locale, commandLine.errors);
        }
        if (commandLine.errors.length > 0) {
            reportDiagnostics(commandLine.errors);
            return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
        }
        if (commandLine.options.version) {
            reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.Version_0, ts.version));
            return ts.sys.exit(ts.ExitStatus.Success);
        }
        if (commandLine.options.help) {
            printVersion();
            printHelp();
            return ts.sys.exit(ts.ExitStatus.Success);
        }
        if (commandLine.options.project) {
            if (!isJSONSupported()) {
                reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.The_current_host_does_not_support_the_0_option, "--project"));
                return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
            }
            configFileName = ts.normalizePath(ts.combinePaths(commandLine.options.project, "tsconfig.json"));
            if (commandLine.fileNames.length !== 0) {
                reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.Option_project_cannot_be_mixed_with_source_files_on_a_command_line));
                return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
            }
        }
        else if (commandLine.fileNames.length === 0 && isJSONSupported()) {
            var searchPath = ts.normalizePath(ts.sys.getCurrentDirectory());
            configFileName = ts.findConfigFile(searchPath);
        }
        if (commandLine.fileNames.length === 0 && !configFileName) {
            printVersion();
            printHelp();
            return ts.sys.exit(ts.ExitStatus.Success);
        }
        if (commandLine.options.watch) {
            if (!ts.sys.watchFile) {
                reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.The_current_host_does_not_support_the_0_option, "--watch"));
                return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
            }
            if (configFileName) {
                configFileWatcher = ts.sys.watchFile(configFileName, configFileChanged);
            }
        }
        performCompilation();
        function performCompilation() {
            if (!cachedProgram) {
                if (configFileName) {
                    var result = ts.readConfigFile(configFileName);
                    if (result.error) {
                        reportDiagnostic(result.error);
                        return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
                    }
                    var configObject = result.config;
                    var configParseResult = ts.parseConfigFile(configObject, ts.sys, ts.getDirectoryPath(configFileName));
                    if (configParseResult.errors.length > 0) {
                        reportDiagnostics(configParseResult.errors);
                        return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
                    }
                    rootFileNames = configParseResult.fileNames;
                    compilerOptions = ts.extend(commandLine.options, configParseResult.options);
                }
                else {
                    rootFileNames = commandLine.fileNames;
                    compilerOptions = commandLine.options;
                }
                compilerHost = ts.createCompilerHost(compilerOptions);
                hostGetSourceFile = compilerHost.getSourceFile;
                compilerHost.getSourceFile = getSourceFile;
            }
            var compileResult = compile(rootFileNames, compilerOptions, compilerHost);
            if (!compilerOptions.watch) {
                return ts.sys.exit(compileResult.exitStatus);
            }
            setCachedProgram(compileResult.program);
            reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.Compilation_complete_Watching_for_file_changes));
        }
        function getSourceFile(fileName, languageVersion, onError) {
            if (cachedProgram) {
                var sourceFile = cachedProgram.getSourceFile(fileName);
                if (sourceFile && sourceFile.fileWatcher) {
                    return sourceFile;
                }
            }
            var sourceFile = hostGetSourceFile(fileName, languageVersion, onError);
            if (sourceFile && compilerOptions.watch) {
                sourceFile.fileWatcher = ts.sys.watchFile(sourceFile.fileName, function () { return sourceFileChanged(sourceFile); });
            }
            return sourceFile;
        }
        function setCachedProgram(program) {
            if (cachedProgram) {
                var newSourceFiles = program ? program.getSourceFiles() : undefined;
                ts.forEach(cachedProgram.getSourceFiles(), function (sourceFile) {
                    if (!(newSourceFiles && ts.contains(newSourceFiles, sourceFile))) {
                        if (sourceFile.fileWatcher) {
                            sourceFile.fileWatcher.close();
                            sourceFile.fileWatcher = undefined;
                        }
                    }
                });
            }
            cachedProgram = program;
        }
        function sourceFileChanged(sourceFile) {
            sourceFile.fileWatcher.close();
            sourceFile.fileWatcher = undefined;
            startTimer();
        }
        function configFileChanged() {
            setCachedProgram(undefined);
            startTimer();
        }
        function startTimer() {
            if (timerHandle) {
                clearTimeout(timerHandle);
            }
            timerHandle = setTimeout(recompile, 250);
        }
        function recompile() {
            timerHandle = undefined;
            reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.File_change_detected_Starting_incremental_compilation));
            performCompilation();
        }
    }
    ts.executeCommandLine = executeCommandLine;
    function compile(fileNames, compilerOptions, compilerHost) {
        ts.ioReadTime = 0;
        ts.ioWriteTime = 0;
        ts.programTime = 0;
        ts.bindTime = 0;
        ts.checkTime = 0;
        ts.emitTime = 0;
        var program = ts.createProgram(fileNames, compilerOptions, compilerHost);
        var exitStatus = compileProgram();
        if (compilerOptions.listFiles) {
            ts.forEach(program.getSourceFiles(), function (file) {
                ts.sys.write(file.fileName + ts.sys.newLine);
            });
        }
        if (compilerOptions.diagnostics) {
            var memoryUsed = ts.sys.getMemoryUsage ? ts.sys.getMemoryUsage() : -1;
            reportCountStatistic("Files", program.getSourceFiles().length);
            reportCountStatistic("Lines", countLines(program));
            reportCountStatistic("Nodes", program.getNodeCount());
            reportCountStatistic("Identifiers", program.getIdentifierCount());
            reportCountStatistic("Symbols", program.getSymbolCount());
            reportCountStatistic("Types", program.getTypeCount());
            if (memoryUsed >= 0) {
                reportStatisticalValue("Memory used", Math.round(memoryUsed / 1000) + "K");
            }
            reportTimeStatistic("I/O read", ts.ioReadTime);
            reportTimeStatistic("I/O write", ts.ioWriteTime);
            reportTimeStatistic("Parse time", ts.programTime);
            reportTimeStatistic("Bind time", ts.bindTime);
            reportTimeStatistic("Check time", ts.checkTime);
            reportTimeStatistic("Emit time", ts.emitTime);
            reportTimeStatistic("Total time", ts.programTime + ts.bindTime + ts.checkTime + ts.emitTime);
        }
        return { program: program, exitStatus: exitStatus };
        function compileProgram() {
            var diagnostics = program.getSyntacticDiagnostics();
            reportDiagnostics(diagnostics);
            if (diagnostics.length === 0) {
                var diagnostics = program.getGlobalDiagnostics();
                reportDiagnostics(diagnostics);
                if (diagnostics.length === 0) {
                    var diagnostics = program.getSemanticDiagnostics();
                    reportDiagnostics(diagnostics);
                }
            }
            if (compilerOptions.noEmit) {
                return diagnostics.length
                    ? ts.ExitStatus.DiagnosticsPresent_OutputsSkipped
                    : ts.ExitStatus.Success;
            }
            var emitOutput = program.emit();
            reportDiagnostics(emitOutput.diagnostics);
            if (emitOutput.emitSkipped) {
                return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
            }
            if (diagnostics.length > 0 || emitOutput.diagnostics.length > 0) {
                return ts.ExitStatus.DiagnosticsPresent_OutputsGenerated;
            }
            return ts.ExitStatus.Success;
        }
    }
    function printVersion() {
        ts.sys.write(getDiagnosticText(ts.Diagnostics.Version_0, ts.version) + ts.sys.newLine);
    }
    function printHelp() {
        var output = "";
        var syntaxLength = getDiagnosticText(ts.Diagnostics.Syntax_Colon_0, "").length;
        var examplesLength = getDiagnosticText(ts.Diagnostics.Examples_Colon_0, "").length;
        var marginLength = Math.max(syntaxLength, examplesLength);
        var syntax = makePadding(marginLength - syntaxLength);
        syntax += "tsc [" + getDiagnosticText(ts.Diagnostics.options) + "] [" + getDiagnosticText(ts.Diagnostics.file) + " ...]";
        output += getDiagnosticText(ts.Diagnostics.Syntax_Colon_0, syntax);
        output += ts.sys.newLine + ts.sys.newLine;
        var padding = makePadding(marginLength);
        output += getDiagnosticText(ts.Diagnostics.Examples_Colon_0, makePadding(marginLength - examplesLength) + "tsc hello.ts") + ts.sys.newLine;
        output += padding + "tsc --out file.js file.ts" + ts.sys.newLine;
        output += padding + "tsc @args.txt" + ts.sys.newLine;
        output += ts.sys.newLine;
        output += getDiagnosticText(ts.Diagnostics.Options_Colon) + ts.sys.newLine;
        var optsList = ts.filter(ts.optionDeclarations.slice(), function (v) { return !v.experimental; });
        optsList.sort(function (a, b) { return ts.compareValues(a.name.toLowerCase(), b.name.toLowerCase()); });
        var marginLength = 0;
        var usageColumn = [];
        var descriptionColumn = [];
        for (var i = 0; i < optsList.length; i++) {
            var option = optsList[i];
            if (!option.description) {
                continue;
            }
            var usageText = " ";
            if (option.shortName) {
                usageText += "-" + option.shortName;
                usageText += getParamType(option);
                usageText += ", ";
            }
            usageText += "--" + option.name;
            usageText += getParamType(option);
            usageColumn.push(usageText);
            descriptionColumn.push(getDiagnosticText(option.description));
            marginLength = Math.max(usageText.length, marginLength);
        }
        var usageText = " @<" + getDiagnosticText(ts.Diagnostics.file) + ">";
        usageColumn.push(usageText);
        descriptionColumn.push(getDiagnosticText(ts.Diagnostics.Insert_command_line_options_and_files_from_a_file));
        marginLength = Math.max(usageText.length, marginLength);
        for (var i = 0; i < usageColumn.length; i++) {
            var usage = usageColumn[i];
            var description = descriptionColumn[i];
            output += usage + makePadding(marginLength - usage.length + 2) + description + ts.sys.newLine;
        }
        ts.sys.write(output);
        return;
        function getParamType(option) {
            if (option.paramType !== undefined) {
                return " " + getDiagnosticText(option.paramType);
            }
            return "";
        }
        function makePadding(paddingLength) {
            return Array(paddingLength + 1).join(" ");
        }
    }
})(ts || (ts = {}));
ts.executeCommandLine(ts.sys.args);
