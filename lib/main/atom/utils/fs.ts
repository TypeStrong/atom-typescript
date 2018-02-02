/**
 * Wraps fs and path into a nice "consistentPath" API
 */

export function consistentPath(filePath: string): string {
  return filePath.split("\\").join("/")
}

import * as path from "path"
import * as fs from "fs"

// Atom uses system dependent path separators while Typescript uses /. Unfortunately, we
// needs this to make sure things like lint errors work.
export const systemPath: (filePath: string) => string =
  path.sep === "\\" ? filePath => filePath.replace(/\//g, "\\") : filePath => filePath

// adapted from for fs-plus: check if a path is an existing file
export function isFileSync(filePath: string): boolean {
  if (!filePath || typeof filePath !== "string" || filePath.length < 1) {
    return false
  }
  let stat: fs.Stats
  try {
    stat = fs.statSync(filePath)
  } catch {
    return false
  }
  if (stat) {
    return stat.isFile()
  } else {
    return false
  }
}

export const readFileSync = fs.readFileSync
