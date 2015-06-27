/**
 * We keep an in memory cache of certain knowledge points regarding a few file paths
 * This file maintains that
 */
export interface FileStatus {
    /** True if the file has been saved and compiled during the current session */
    saved: boolean;
    /** True if the file differs from the one on the disk */
    modified: boolean;
};

let fileStatuses: { [index: string]: FileStatus } = {};
export function getFileStatus(filePath: string): FileStatus {
    if (!fileStatuses[filePath]) {
        fileStatuses[filePath] = { modified: false, saved: false };
    }
    return fileStatuses[filePath];
}
