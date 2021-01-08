import * as fs from "fs"
import * as jsonc from "jsonc-parser"
import * as path from "path"
import Resolve from "resolve"

export interface Binary {
  version: string
  pathToBin: string
}

interface ConfigObject {
  tsdkPath: string
}

interface VSCodeConfigObject {
  "typescript.tsdk": string
}

export async function resolveBinary(
  sourcePath: string,
  binBaseName: "tsc" | "tsserver",
): Promise<Binary> {
  const {NODE_PATH} = process.env as {NODE_PATH?: string}
  const binName = `${binBaseName}.js`

  const resolvedPath = await resolveModule(`typescript/lib/${binName}`, {
    basedir: path.dirname(sourcePath),
    paths: NODE_PATH !== undefined ? NODE_PATH.split(path.delimiter) : undefined,
  }).catch(async () => {
    // try to get typescript from auxiliary config file
    const auxTsdkPath = await getSDKPath(path.dirname(sourcePath))
    if (auxTsdkPath !== undefined) {
      const binPath = path.join(auxTsdkPath, "lib", binName)
      const exists = await fsExists(binPath)
      if (exists) return binPath
    }

    // try to get typescript from configured tsdkPath
    const tsdkPath = atom.config.get("atom-typescript.tsdkPath")
    if (tsdkPath) {
      const binPath = path.join(tsdkPath, "lib", binName)
      const exists = await fsExists(binPath)
      if (exists) return binPath
    }

    // use bundled version
    const defaultPath = require.resolve(`typescript/lib/${binName}`)
    return defaultPath
  })

  const packagePath = path.resolve(resolvedPath, "../../package.json")
  // tslint:disable-next-line:no-unsafe-any
  const version: string = require(packagePath).version

  return {
    version,
    pathToBin: resolvedPath,
  }
}

// Promisify the async resolve function
async function resolveModule(id: string, opts: Resolve.AsyncOpts): Promise<string> {
  return new Promise<string>((resolve, reject) =>
    Resolve(id, opts, (err, result) => {
      if (err) {
        reject(err)
      } else if (result === undefined) {
        reject(new Error("Module path is undefined"))
      } else {
        resolve(result)
      }
    }),
  )
}

async function fsExists(p: string) {
  return new Promise<boolean>((resolve) =>
    fs.access(p, fs.constants.F_OK, (err: NodeJS.ErrnoException | null) => {
      if (err) resolve(false)
      else resolve(true)
    }),
  )
}

async function fsReadFile(p: string) {
  return new Promise<string>((resolve, reject) =>
    fs.readFile(p, (error, data) => {
      if (error) reject(error)
      else resolve(data.toString("utf-8"))
    }),
  )
}

async function tryConfigFiles(basedir: string, relpaths: string[][]) {
  for (const relpath of relpaths) {
    const configFile = path.join(basedir, ...relpath)
    if (await fsExists(configFile)) return configFile
  }
}

async function resolveConfigFile(initialBaseDir: string) {
  let basedir = initialBaseDir
  let parent = path.dirname(basedir)
  while (basedir !== parent) {
    const configFile = await tryConfigFiles(basedir, [
      [".atom-typescript.json"],
      [".atom", "atom-typescript.json"],
      [".vscode", "settings.json"],
    ])
    if (configFile !== undefined) return {basedir, configFile}
    basedir = parent
    parent = path.dirname(basedir)
  }
}

function isConfigObject(x: any): x is ConfigObject {
  // tslint:disable-next-line: no-unsafe-any
  return typeof x === "object" && x !== null && typeof x.tsdkPath === "string"
}
function isVSCodeConfigObject(x: any): x is VSCodeConfigObject {
  // tslint:disable-next-line: no-unsafe-any
  return typeof x === "object" && x !== null && typeof x["typescript.tsdk"] === "string"
}

async function getSDKPath(dirname: string) {
  const configFile = await resolveConfigFile(dirname)
  if (configFile) {
    try {
      const configFileContents = jsonc.parse(await fsReadFile(configFile.configFile)) as unknown
      let tsdkPath
      if (isConfigObject(configFileContents)) {
        tsdkPath = configFileContents.tsdkPath
      } else if (isVSCodeConfigObject(configFileContents)) {
        // NOTE: VSCode asks for path to "typescript/lib", while
        // we only want path to "typescript". Hence the dirname here
        tsdkPath = path.dirname(configFileContents["typescript.tsdk"])
      } else {
        return undefined
      }
      return path.isAbsolute(tsdkPath) ? tsdkPath : path.join(configFile.basedir, tsdkPath)
    } catch (e) {
      console.warn(e)
    }
  }
}
