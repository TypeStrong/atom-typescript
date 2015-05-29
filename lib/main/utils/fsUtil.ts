/**
 * Wraps fs and path into a nice "consistentPath" API
 */

/** we work with "/" for all paths (so does the typescript language service) */
export function consistentPath(filePath: string): string {
    return filePath.split('\\').join('/');
}
