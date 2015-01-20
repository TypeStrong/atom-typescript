/// <reference path="../../src/typings/vendor.d.ts" />
/// <reference path="../../src/lib/interfaces.d.ts" />
export declare var defaults: CompilerOptions;
export declare function getProjectSync(pathOrSrcFile: string): TypeScriptProjectFileDetails;
export declare function createProjectRootSync(pathOrSrcFile: string, defaultOptions?: CompilerOptions): void;
