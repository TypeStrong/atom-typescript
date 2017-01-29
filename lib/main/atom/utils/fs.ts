/**
 * Wraps fs and path into a nice "consistentPath" API
 */

export function consistentPath(filePath: string): string {
  return filePath.split('\\').join('/');
}

import * as path from "path";

// Atom uses system dependent path separators while Typescript uses /. Unfortunately, we
// needs this to make sure things like lint errors work.
export const systemPath: (filePath: string) => string = path.sep === "\\" ? filePath => filePath.replace(/\//g, "\\") : filePath => filePath

/**
 * Resolves to to an absolute path.
 * @param from,to,to,to...
 */
export function resolve(...args: string[]) {
    return consistentPath(path.resolve(...args));
}

/**
 * Converts "C:\boo" , "C:\boo\foo.ts" => "./foo.ts"; Works on unix as well.
 */
export function makeRelativePath(relativeFolder: string, filePath: string) {
    var relativePath = path.relative(relativeFolder, filePath).split('\\').join('/');
    if (relativePath[0] !== '.') {
        relativePath = './' + relativePath;
    }
    return relativePath;
}

export function removeExt(filePath: string) {
    return filePath.substr(0, filePath.lastIndexOf('.'));
}
