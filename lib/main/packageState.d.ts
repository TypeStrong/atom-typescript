import {FileLocationQuery} from "./atom/utils"
export type State = StateV01
export interface StateV01 {
  version: "0.1"
  editorPosHistState: FileLocationQuery[]
}
