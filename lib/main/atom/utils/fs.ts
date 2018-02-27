import * as path from "path"
import * as fs from "fs"

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

export const parsePath = path.parse
