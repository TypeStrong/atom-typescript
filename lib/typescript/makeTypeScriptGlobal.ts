import {isAbsolute} from "path"

// Debugging helper
global.stack = function() {
    console.error((<any>new Error()).stack);
}

// Export Typescript as a global. Takes an optional full path to typescriptServices.js
export function makeTsGlobal(typescriptPath?: string) {
  if (typescriptPath) {
    if (!isAbsolute(typescriptPath)) {
      throw new Error(`Path to Typescript "${typescriptPath}" is not absolute`)
    }

    typescriptPath = typescriptPath.trim()
  } else {
    typescriptPath = "typescript"
  }

  global.ts = require(typescriptPath);
}
