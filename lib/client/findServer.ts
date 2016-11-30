import * as fs from "fs"
import * as path from "path"

export interface Server {
  /** Path the the tsserver executable */
  binPath: string

  /* Path where the node_modules directory is that contains the typescript installation */
  prefix: string

  /* Version of Typescript */
  version: string
}

/** Recursively search all directories rooted at the argument and find all typescript modules */
export function findTypescriptServers(root: string): Promise<Server[]> {
  const results: Server[] = []

  if (!path.isAbsolute(root)) {
    throw new Error("Argument should be an absolute path")
  }

  return new Promise(resolve => {
    walk(root, () => {
      resolve(results)
    })
  })

  function walk(dir: string, done: Function) {
    fs.readdir(dir, (err, files) => {
      if (err || files.length === 0) return done()

      const doneEntry = after(files.length, () => {
        done()
      })

      for (const entry of files) {
        if (entry === "node_modules") {
          fs.stat(path.join(dir, entry, "typescript"), err => {
            if (err) {
              doneEntry()
            } else {
              getServerInfo(dir, (err, info) => {
                if (info) results.push(info)
                doneEntry()
              })
            }
          })
        } else if (entry === ".git" || entry === "bower_components") {
          doneEntry()
        } else {
          walk(path.join(dir, entry), doneEntry)
        }
      }
    })
  }
}

/** Get info about the tsserver at the prefix */
function getServerInfo(prefix: string, callback: (err: Error, info: Server) => any) {
  const tsDir = path.join(prefix, "node_modules", "typescript")

  fs.readFile(path.join(tsDir, "package.json"), "utf8", (err, pkg) => {
    if (err) return callback(err, null)

    try {
      const version = JSON.parse(pkg).version
      const tsServerPath = path.join(tsDir, "bin", "tsserver")

      fs.stat(tsServerPath, (err, stat) => {
        if (err) return callback(err, null)

        callback(null, {
          binPath: tsServerPath,
          prefix,
          version
        })
      })
    } catch (error) {
      callback(error, null)
    }
  })
}

function after(count: number, callback: Function) {
  let called = 0

  return function() {
    called++

    if (called >= count) {
      callback.apply(this, arguments)
    }
  }
}
