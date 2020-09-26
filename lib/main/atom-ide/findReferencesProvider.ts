import {FindReferencesProvider, Reference} from "atom-ide-base"
import {GetClientFunction} from "../../client"
import {getFilePathPosition, isTypescriptEditorWithPath, locationsToRange} from "../atom/utils"

export function getFindReferencesProvider(getClient: GetClientFunction): FindReferencesProvider {
  return {
    async isEditorSupported(editor) {
      return isTypescriptEditorWithPath(editor)
    },
    async findReferences(editor, position) {
      const location = getFilePathPosition(editor, position)
      if (!location) return

      const client = await getClient(location.file)
      const result = await client.execute("references", location)
      if (!result.body) return
      return {
        type: "data",
        baseUri: location.file,
        referencedSymbolName: result.body.symbolDisplayString,
        references: result.body.refs.map(refTsToIde),
      }
    },
  }
}

function refTsToIde(ref: protocol.ReferencesResponseItem): Reference {
  return {
    uri: ref.file,
    range: locationsToRange(ref.start, ref.end),
    name: undefined,
  }
}
