import {CompositeDisposable} from "atom"
import {GetClientFunction} from "../../../client"
import {OccurenceController} from "./controller"

export class OccurrenceManager {
  private readonly disposables = new CompositeDisposable()

  constructor(getClient: GetClientFunction) {
    this.disposables.add(
      atom.workspace.observeTextEditors((editor) => {
        const controller = new OccurenceController(getClient, editor)
        this.disposables.add(
          controller,
          editor.onDidDestroy(() => {
            this.disposables.remove(controller)
            controller.dispose()
          }),
        )
      }),
    )
  }

  public dispose() {
    this.disposables.dispose()
  }
}
