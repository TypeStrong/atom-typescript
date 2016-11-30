import {findTypescriptServers} from "./findServer"
import {TypescriptServiceClient} from "./client"
import * as fs from "fs"
import * as path from "path"
import * as nodeResolve from "resolve"

const defaultServerPath = require.resolve("typescript/bin/tsserver")
const defaultServerVersion = require("typescript/package.json").version
const defaultServer = new TypescriptServiceClient(defaultServerPath, defaultServerVersion)

/**
 * ClientResolver takes care of finding the correct tsserver for a source file based on how a
 * require("typescript") from the same source file would resolve.
 */
export class ClientResolver {
  clients: {
    prefix: string,
    client: TypescriptServiceClient
  }[] = []

  get(filePath: string): Promise<TypescriptServiceClient> {
    const client = this.clients.find(client => filePath.startsWith(client.prefix))

    if (client) {
      return Promise.resolve(client.client)
    }

    // If we didn't find a client in the clients array, we need to resolve, start and add a new one
    return this.resolveFrom(filePath)
  }

  private addClient(prefix: string, client: TypescriptServiceClient) {
    const existingClient = this.clients.find(client => client.prefix === prefix)

    if (existingClient) {
      return
    }

    this.clients.push({
      prefix,
      client
    })

    if (!client.serverPromise) {
      client.startServer()
    }

    // Sort the clients in the descending order of the prefix length
    this.clients.sort((a, b) => a.prefix.length - b.prefix.length)
  }

  private resolveFrom(filePath: string): Promise<TypescriptServiceClient> {
    const basedir = path.dirname(filePath)

    return resolveLocalServer(basedir)
      .then(tsServerPath => path.resolve(tsServerPath, "..", "..", "..", ".."))
      .then(findTypescriptServers)
      .then(servers => {
        console.log("got some servers", servers)

        for (const server of servers) {
          this.addClient(server.prefix, new TypescriptServiceClient(server.binPath, server.version))
        }

        //
        return this.get(filePath)

    }).catch(() => {
      // TODO: Ensure there are no nested servers under the basedir too
      this.addClient(basedir, defaultServer)
      return defaultServer
    })
  }
}

function resolveLocalServer(basedir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    nodeResolve("typescript/bin/tsserver", {basedir}, (err, resolvedPath) => {
      if (err) {
        reject(err)
      } else {
        resolve(resolvedPath)
      }
    })
  })
}

// /** Given a start directory, try to resolve tsserver executable from node_modules */
// export function findTSServer(basedir: string): string {
//   const tsPath = resolve.sync("typescript/package.json", {basedir})
//   const tsServerPath = path.resolve(path.dirname(tsPath), "bin", "tsserver")
//
//   // This will throw if the file does not exist on the disk
//   fs.statSync(tsServerPath)
//
//   return tsServerPath
// }
