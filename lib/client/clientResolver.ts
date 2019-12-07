import {CompositeDisposable, Emitter} from "atom"
import * as fs from "fs"
import * as jsonc from "jsonc-parser"
import * as path from "path"
import * as Resolve from "resolve"
import * as ts from "typescript"
import {
  ConfigFileDiagnosticEventBody,
  Diagnostic,
  DiagnosticEventBody,
} from "typescript/lib/protocol"
import {ReportBusyWhile} from "../main/pluginManager"
import {TypescriptServiceClient as Client} from "./client"

export type DiagnosticTypes = protocol.DiagnosticEventKind | "configFileDiag"

interface DiagnosticsPayload {
  diagnostics: Diagnostic[]
  filePath: string
  serverPath: string
  type: DiagnosticTypes
}

interface Binary {
  version: string
  pathToBin: string
}

export interface EventTypes {
  diagnostics: DiagnosticsPayload
}

/**
 * ClientResolver takes care of finding the correct tsserver for a source file based on how a
 * require("typescript") from the same source file would resolve.
 */
export class ClientResolver {
  private clients = new Map<string, Map<string | undefined, Client>>()
  private memoizedClients = new Map<string, Client>()
  private emitter = new Emitter<{}, EventTypes>()
  private subscriptions = new CompositeDisposable()
  private tsserverInstancePerTsconfig = atom.config.get("atom-typescript")
    .tsserverInstancePerTsconfig
  // This is just here so TypeScript can infer the types of the callbacks when using "on" method
  // tslint:disable-next-line:member-ordering
  public on = this.emitter.on.bind(this.emitter)

  constructor(private reportBusyWhile: ReportBusyWhile) {}

  public async restartAllServers() {
    await this.reportBusyWhile("Restarting servers", () =>
      Promise.all(Array.from(this.getAllClients()).map(client => client.restartServer())),
    )
  }

  public async get(pFilePath: string): Promise<Client> {
    const memo = this.memoizedClients.get(pFilePath)
    if (memo) return memo
    const client = await this._get(pFilePath)
    this.memoizedClients.set(pFilePath, client)
    return client
  }

  public dispose() {
    this.emitter.dispose()
    this.subscriptions.dispose()
    this.memoizedClients.clear()
    this.clients.clear()
  }

  private async _get(pFilePath: string): Promise<Client> {
    const {pathToBin, version} = await resolveBinary(pFilePath, "tsserver")
    const tsconfigPath = this.tsserverInstancePerTsconfig
      ? ts.findConfigFile(pFilePath, f => ts.sys.fileExists(f))
      : undefined

    let tsconfigMap = this.clients.get(pathToBin)
    if (!tsconfigMap) {
      tsconfigMap = new Map()
      this.clients.set(pathToBin, tsconfigMap)
    }
    const client = tsconfigMap.get(tsconfigPath)
    if (client) return client

    const newClient = new Client(pathToBin, version, this.reportBusyWhile)
    tsconfigMap.set(tsconfigPath, newClient)

    this.subscriptions.add(
      newClient.on("configFileDiag", this.diagnosticHandler(pathToBin, "configFileDiag")),
      newClient.on("semanticDiag", this.diagnosticHandler(pathToBin, "semanticDiag")),
      newClient.on("syntaxDiag", this.diagnosticHandler(pathToBin, "syntaxDiag")),
      newClient.on("suggestionDiag", this.diagnosticHandler(pathToBin, "suggestionDiag")),
    )

    return newClient
  }

  private *getAllClients() {
    for (const tsconfigMap of this.clients.values()) {
      yield* tsconfigMap.values()
    }
  }

  private diagnosticHandler = (serverPath: string, type: DiagnosticTypes) => (
    result: DiagnosticEventBody | ConfigFileDiagnosticEventBody,
  ) => {
    const filePath = isConfDiagBody(result) ? result.configFile : result.file

    if (filePath) {
      this.emitter.emit("diagnostics", {
        type,
        serverPath,
        filePath,
        diagnostics: result.diagnostics,
      })
    }
  }
}

// Promisify the async resolve function
const resolveModule = (id: string, opts: Resolve.AsyncOpts): Promise<string> => {
  return new Promise<string>((resolve, reject) =>
    Resolve(id, opts, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    }),
  )
}

async function fsExists(p: string) {
  return new Promise<boolean>(resolve => fs.exists(p, resolve))
}

async function fsReadFile(p: string) {
  return new Promise<string>((resolve, reject) =>
    fs.readFile(p, (error, data) => {
      if (error) reject(error)
      else resolve(data.toString("utf-8"))
    }),
  )
}

async function tryConfigFile(basedir: string, relpath: string[]) {
  const configFile = path.join(basedir, ...relpath)
  if (await fsExists(configFile)) return configFile
}

async function tryConfigFiles(basedir: string, relpaths: string[][]) {
  for (const relpath of relpaths) {
    const cf = await tryConfigFile(basedir, relpath)
    if (cf !== undefined) return cf
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

interface ConfigObject {
  tsdkPath: string
}

interface VSCodeConfigObject {
  "typescript.tsdk": string
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

export async function resolveBinary(sourcePath: string, binName: string): Promise<Binary> {
  const {NODE_PATH} = process.env as {NODE_PATH?: string}

  const resolvedPath = await resolveModule(`typescript/bin/${binName}`, {
    basedir: path.dirname(sourcePath),
    paths: NODE_PATH !== undefined ? NODE_PATH.split(path.delimiter) : undefined,
  }).catch(async () => {
    // try to get typescript from auxiliary config file
    const auxTsdkPath = await getSDKPath(path.dirname(sourcePath))
    if (auxTsdkPath !== undefined) {
      const binPath = path.join(auxTsdkPath, "bin", binName)
      console.log(binPath)
      const exists = await fsExists(binPath)
      if (exists) return binPath
    }

    // try to get typescript from configured tsdkPath
    const tsdkPath = atom.config.get("atom-typescript.tsdkPath")
    if (tsdkPath) {
      const binPath = path.join(tsdkPath, "bin", binName)
      const exists = await fsExists(binPath)
      if (exists) return binPath
    }

    // use bundled version
    const defaultPath = require.resolve(`typescript/bin/${binName}`)
    return defaultPath
  })

  const packagePath = path.resolve(resolvedPath, "../../package.json")
  // tslint:disable-next-line:no-unsafe-any
  const version: string = require(packagePath).version
  console.log(`found ${version} of ${resolvedPath}`)

  return {
    version,
    pathToBin: resolvedPath,
  }
}

function isConfDiagBody(body: any): body is ConfigFileDiagnosticEventBody {
  // tslint:disable-next-line:no-unsafe-any
  return body && body.triggerFile && body.configFile
}
