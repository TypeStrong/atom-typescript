/**
 * We keep an in memory cache of certain knowledge points regarding a few file paths
 * This file maintains that
 */
import * as path from 'path';
import {consistentPath} from '../utils/fsUtil';

export interface FileStatus {
    /** True if the emit on the disk differs from the potential emit of the current ts file */
    emitDiffers: boolean;
    /** True if the text in the editor has been modified during the current session */
    modified: boolean;
};

let fileStatuses: { [index: string]: FileStatus } = {};
export function getFileStatus(filePath: string): FileStatus {
    filePath = consistentPath(filePath);
    if (!fileStatuses[filePath]) {
        fileStatuses[filePath] = { modified: false, emitDiffers: false };
    }
    return fileStatuses[filePath];
}
