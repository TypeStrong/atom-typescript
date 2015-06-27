/**
 * We keep an in memory cache of certain knowledge points regarding a few file paths
 * This file maintains that
 */
export interface FileStatus {
    /** True if the on disk version of the file has been *succesfully* compiled during the current session */
    saveSynced: boolean;
    /** True if the file differs from the one on the disk */
    modified: boolean;
};

let fileStatuses: { [index: string]: FileStatus } = {};
export function getFileStatus(filePath: string): FileStatus {
    if (!fileStatuses[filePath]) {
        fileStatuses[filePath] = { modified: false, saveSynced: false };
    }
    return fileStatuses[filePath];
}
