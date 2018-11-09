import {CompositeDisposable, Emitter} from "atom"
import * as fs from "fs"
import * as path from "path"
import * as Resolve from "resolve"
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
  private emitter = new Emitter<{}, EventTypes>()
  private subscriptions = new CompositeDisposable()
  // This is just here so TypeScript can infer the types of the callbacks when using "on" method
  // tslint:disable-next-line:member-ordering
  public on = this.emitter.on.bind(this.emitter)

  constructor(private reportBusyWhile: ReportBusyWhile) {}

  public async restartAllServers() {
    await Promise.all(Array.from(this.getAllClients()).map(client => client.restartServer()))
  }

  public async get(pFilePath: string): Promise<Client> {
    const {pathToBin, version} = await resolveBinary(pFilePath, "tsserver")
    const tsconfigPath = await resolveTsConfig(pFilePath)

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

  public dispose() {
    this.emitter.dispose()
    this.subscriptions.dispose()
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

export async function resolveBinary(sourcePath: string, binName: string): Promise<Binary> {
  const {NODE_PATH} = process.env as {NODE_PATH?: string}
  const defaultPath = require.resolve(`typescript/bin/${binName}`)

  const resolvedPath = await resolveModule(`typescript/bin/${binName}`, {
    basedir: path.dirname(sourcePath),
    paths: NODE_PATH !== undefined ? NODE_PATH.split(path.delimiter) : undefined,
  }).catch(() => defaultPath)

  const packagePath = path.resolve(resolvedPath, "../../package.json")
  // tslint:disable-next-line:no-unsafe-any
  const version: string = require(packagePath).version

  return {
    version,
    pathToBin: resolvedPath,
  }
}

async function fsexists(filePath: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    fs.exists(filePath, resolve)
  })
}

async function resolveTsConfig(sourcePath: string): Promise<string | undefined> {
  let parentDir = path.dirname(sourcePath)
  let tsconfigPath = path.join(parentDir, "tsconfig.json")
  while (!(await fsexists(tsconfigPath))) {
    const oldParentDir = parentDir
    parentDir = path.dirname(parentDir)
    if (oldParentDir === parentDir) return undefined
    tsconfigPath = path.join(parentDir, "tsconfig.json")
  }
  return tsconfigPath
}

function isConfDiagBody(body: any): body is ConfigFileDiagnosticEventBody {
  // tslint:disable-next-line:no-unsafe-any
  return body && body.triggerFile && body.configFile
}
