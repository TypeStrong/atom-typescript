/// <reference path="../../src/typings/vendor.d.ts" />
/// <reference path="../../src/lib/interfaces.d.ts" />
export declare var defaults: CompilerOptions;
export declare function getProjectsSync(pathOrSrcFile: string): TypeScriptProjectFileDetails;
export declare function createProjectsRootSync(pathOrSrcFile: string, defaultOptions?: CompilerOptions): void;
