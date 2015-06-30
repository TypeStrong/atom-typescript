/**
 * We keep an in memory cache of certain knowledge points regarding a few file paths
 * This file maintains that
 */
export interface FileStatus {
    /** True if the emit on the disk differs from the potential emit of the current ts file */
    emitDiffers: boolean;
    /** True if the text in the editor has been modified during the current session */
    modified: boolean;
};

let fileStatuses: { [index: string]: FileStatus } = {};
export function getFileStatus(filePath: string): FileStatus {
    if (!fileStatuses[filePath]) {
        fileStatuses[filePath] = { modified: false, emitDiffers: false };
    }
    return fileStatuses[filePath];
}
