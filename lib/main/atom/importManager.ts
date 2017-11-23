import * as path from "path"
import * as Atom from "atom"

interface SymbolSource {
  source: string

  // The filename of tsconfig must be here, because it can be different for
  // each sourcefile (even if it's very uncommon.
  tsconfigFilename: string
}

interface FileImports {
  // The source where the `symbols` are imported from. That is, efter the `from` string.
  // In `import { foo } from './foo'` -> `./foo` is source
  source: string

  // The imported symbols
  symbols: string[]

  // The range in the textbuffer which this import takes.
  range: TextBuffer.IRange

  // If the import is importing the default export (e.g `import foo from './foo'`).
  isDefault: boolean
}

const ES6_IMPORT_REGEX = /\bimport\s+(?:(.+\s+)from\s+)?[\'"]([^"\']+)["\'];?/g
const NODE_MODULES_REGEX = /\/node_modules\/(?:@types\/)?([^\/]+)/

export class ImportManager {
  private symbolSourceMap: {
    [key: string]: SymbolSource
  } = {}

  /**
   * List all the imports in the specified editor.
   */
  private getImports(editor: AtomCore.IEditor): FileImports[] {
    const results: FileImports[] = []
    editor.getBuffer().scan(ES6_IMPORT_REGEX, ({match, range}: TextBuffer.ScanCallbackArgs) => {
      const symbols = match[1]
        .replace(/^[\s{]+/, "") // Remove initial spaces and curly brackets
        .replace(/[\s}]+$/, "") // Remove trailing spaces and curly brackets
        .split(",") // Split, so each symbol is an entry in array
        .map(symbol => symbol.trim()) // trim it to get rid of excess whitespaces
      const source = match[2].trim()
      const isDefault = !match[1].includes("{") // Default import if there are no curly brackets at all
      results.push({source, symbols, isDefault, range})
    })

    return results
  }

  /**
   * Given an a source file name, `from`, find the best way to resolve `to`.
   * This takes various typescript options (such as a modified module resolution)
   * into account.
   */
  private resolve(from: string, to: string, tsconfigFilename: string): string {
    if (!to || !from) {
      throw new Error("Neither `from`, nor `to` may be undefined.")
    }

    const tsconfig = require(tsconfigFilename)
    let baseUrl: string = tsconfig.compilerOptions.baseUrl || ""
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1)
    }

    const absoluteBaseUrl = path.join(path.dirname(tsconfigFilename), baseUrl)

    // Check for node_modules
    const nodeModuleMatch = NODE_MODULES_REGEX.exec(to)
    if (nodeModuleMatch) {
      return nodeModuleMatch[1]
    }

    // Check for resolved module configurations
    for (let key in tsconfig.compilerOptions.paths) {
      for (let search of tsconfig.compilerOptions.paths[key]) {
        const regex = `${absoluteBaseUrl}/${search.split("*").join("(.*)")}`
        const match = new RegExp(regex).exec(to)
        if (match) {
          return key.replace("*", match[1])
        }
      }
    }

    // If no module configuration matched, just return the closes relative path.
    let relative = path.relative(path.dirname(from), to)
    if (path.dirname(to).startsWith(path.dirname(from))) {
      // `to` is a direct descendent of `from` and relative would give only the pathname
      // without `./`, so prepend it.
      relative = `./${relative}`
    }

    return relative
  }

  private getImportString(symbols: string[], source: string, eol = "") {
    const fmt: string = atom.config.get("atom-typescript.autoImport.format")
    return fmt.replace("#SYMBOLS", symbols.join(", ")).replace("#SOURCE", source) + eol
  }

  /**
   * In the editor, add an import for the specified symbol.
   */
  public addImport(editor: AtomCore.IEditor, symbol: string): void {
    if (!atom.config.get("atom-typescript.autoImport.enable")) {
      return
    }

    const entry = this.symbolSourceMap[symbol]
    if (!entry) {
      // Unknown symbol location. Nothing to do.
      return
    }

    const importSource = this.resolve(editor.getPath(), entry.source, entry.tsconfigFilename)

    const existingImports = this.getImports(editor)
    const existingSource = existingImports.find(entry => entry.source === importSource)
    if (!existingSource) {
      // If this source is not already imported, add a new one after the last found import.
      const row =
        existingImports.length === 0
          ? 0
          : existingImports[existingImports.length - 1].range.end.row + 1
      editor
        .getBuffer()
        .insert(new Atom.Point(row, 0), this.getImportString([symbol], importSource, "\n"))
      return
    }

    // There is already an import with the same source, replace it.
    let allSymbols = existingSource.symbols
    if (!allSymbols.find(s => s === symbol)) {
      allSymbols = allSymbols.concat(symbol)
    }

    const inputText = this.getImportString(allSymbols, importSource)
    editor.getBuffer().setTextInRange(existingSource.range, inputText, true)
  }

  /**
   * Register a new symbol and its source.
   */
  public registerSymbol(symbol: string, entry: SymbolSource): void {
    this.symbolSourceMap[symbol] = entry
  }
}
