import {WithTypescriptBuffer} from "../../../pluginManager"
import {EditorPositionHistoryManager} from "../../editorPositionHistoryManager"
export interface Deps {
  withTypescriptBuffer: WithTypescriptBuffer
  getEditorPositionHistoryManager: () => EditorPositionHistoryManager
}
