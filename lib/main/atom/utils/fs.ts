/**
 * Wraps fs and path into a nice "consistentPath" API
 */

export function consistentPath(filePath: string): string {
  return filePath.split("\\").join("/")
}

import * as path from "path"

// Atom uses system dependent path separators while Typescript uses /. Unfortunately, we
// needs this to make sure things like lint errors work.
export const systemPath: (filePath: string) => string =
  path.sep === "\\" ? filePath => filePath.replace(/\//g, "\\") : filePath => filePath
