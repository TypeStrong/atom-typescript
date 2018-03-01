import * as Atom from "atom"
import {AutocompleteProvider} from "./atom/autoCompleteProvider"
import {ClientResolver} from "../client/clientResolver"
import {getHyperclickProvider} from "./atom/hyperclickProvider"
import {CodefixProvider, IntentionsProvider, CodeActionsProvider} from "./atom/codefix"
import {CompositeDisposable} from "atom"
import {debounce} from "lodash"
import {ErrorPusher} from "./errorPusher"
import {IndieDelegate} from "atom/linter"
import {StatusBar} from "atom/status-bar"
import {StatusPanel} from "./atom/components/statusPanel"
import {TypescriptEditorPane} from "./typescriptEditorPane"
import {TypescriptBuffer} from "./typescriptBuffer"
import {registerCommands} from "./atom/commands"
import {SemanticViewController} from "./atom/views/outline/semanticViewController"
import {SymbolsViewController} from "./atom/views/symbols/symbolsViewController"

export type WithTypescriptBuffer = <T>(
  filePath: string,
  action: (buffer: TypescriptBuffer) => Promise<T>,
) => Promise<T>

export class PluginManager {
  // components
  private subscriptions: CompositeDisposable
  private clientResolver: ClientResolver
  private statusPanel: StatusPanel
  private errorPusher: ErrorPusher
  private codefixProvider: CodefixProvider
  private semanticViewController: SemanticViewController
  private symbolsViewController: SymbolsViewController
  private readonly panes: TypescriptEditorPane[] = [] // TODO: do we need it?

  public constructor() {
    this.subscriptions = new CompositeDisposable()
    this.clientResolver = new ClientResolver()
    this.statusPanel = new StatusPanel({clientResolver: this.clientResolver})
    this.errorPusher = new ErrorPusher()
    this.codefixProvider = new CodefixProvider(
      this.clientResolver,
      this.errorPusher,
      this.withTypescriptBuffer,
    )
    this.semanticViewController = new SemanticViewController(this.withTypescriptBuffer)
    this.symbolsViewController = new SymbolsViewController({
      withTypescriptBuffer: this.withTypescriptBuffer,
    })
    this.subscriptions.add(this.statusPanel)
    this.subscriptions.add(this.clientResolver)
    this.subscriptions.add(this.errorPusher)
    this.subscriptions.add(this.semanticViewController)
    this.subscriptions.add(this.symbolsViewController)

    // Register the commands
    this.subscriptions.add(registerCommands(this))

    let activePane: TypescriptEditorPane | undefined

    const onSave = debounce((pane: TypescriptEditorPane) => {
      if (!pane.client) {
        return
      }

      const files: string[] = []
      for (const p of this.panes.sort((a, b) => a.activeAt - b.activeAt)) {
        const filePath = p.buffer.getPath()
        if (filePath && p.isTypescript && p.client === p.client) {
          files.push(filePath)
        }
      }

      pane.client.executeGetErr({files, delay: 100})
    }, 50)

    this.subscriptions.add(
      atom.workspace.observeTextEditors((editor: Atom.TextEditor) => {
        this.panes.push(
          new TypescriptEditorPane(editor, {
            getClient: (filePath: string) => this.clientResolver.get(filePath),
            onClose: filePath => {
              // Clear errors if any from this file
              this.errorPusher.setErrors("syntaxDiag", filePath, [])
              this.errorPusher.setErrors("semanticDiag", filePath, [])
            },
            onDispose: pane => {
              if (activePane === pane) {
                activePane = undefined
              }

              this.panes.splice(this.panes.indexOf(pane), 1)
            },
            onSave,
            statusPanel: this.statusPanel,
          }),
        )
      }),
    )

    activePane = this.panes.find(pane => pane.editor === atom.workspace.getActiveTextEditor())

    if (activePane) {
      activePane.onActivated()
    }

    this.subscriptions.add(
      atom.workspace.onDidChangeActiveTextEditor((editor?: Atom.TextEditor) => {
        if (activePane) {
          activePane.onDeactivated()
          activePane = undefined
        }

        const pane = this.panes.find(p => p.editor === editor)
        if (pane) {
          activePane = pane
          pane.onActivated()
        }
      }),
    )
  }

  public destroy() {
    this.subscriptions.dispose()
  }

  public consumeLinter(register: (opts: {name: string}) => IndieDelegate) {
    const linter = register({
      name: "Typescript",
    })

    this.errorPusher.setLinter(linter)

    this.clientResolver.on("diagnostics", ({type, filePath, diagnostics}) => {
      this.errorPusher.setErrors(type, filePath, diagnostics)
    })
  }

  public consumeStatusBar(statusBar: StatusBar) {
    let statusPriority = 100
    for (const panel of statusBar.getRightTiles()) {
      if (atom.views.getView(panel.getItem()).tagName === "GRAMMAR-SELECTOR-STATUS") {
        statusPriority = panel.getPriority() - 1
      }
    }
    const tile = statusBar.addRightTile({
      item: this.statusPanel,
      priority: statusPriority,
    })
    const disp = new Atom.Disposable(() => {
      tile.destroy()
    })
    this.subscriptions.add(disp)
    return disp
  }

  // Registering an autocomplete provider
  public provideAutocomplete() {
    return [
      new AutocompleteProvider(this.clientResolver, {
        withTypescriptBuffer: this.withTypescriptBuffer,
      }),
    ]
  }

  public provideIntentions() {
    return new IntentionsProvider(this.codefixProvider)
  }

  public provideCodeActions(): CodeActionsProvider {
    return new CodeActionsProvider(this.codefixProvider)
  }

  public provideHyperclick() {
    return getHyperclickProvider(this.clientResolver)
  }

  public clearErrors = () => {
    this.errorPusher.clear()
  }

  public getClient = async (filePath: string) => {
    const pane = this.panes.find(p => p.buffer.getPath() === filePath)
    if (pane && pane.client) {
      return pane.client
    }

    return this.clientResolver.get(filePath)
  }

  public getStatusPanel = () => this.statusPanel

  public withTypescriptBuffer: WithTypescriptBuffer = async (filePath, action) => {
    const pane = this.panes.find(p => p.buffer.getPath() === filePath)
    if (pane) return action(pane.buffer)

    // no open buffer
    const buffer = await Atom.TextBuffer.load(filePath)
    try {
      const tsbuffer = TypescriptBuffer.create(buffer, fp => this.clientResolver.get(fp))
      return await action(tsbuffer)
    } finally {
      if (buffer.isModified()) await buffer.save()
      buffer.destroy()
    }
  }

  public getSemanticViewController = () => this.semanticViewController

  public getSymbolsViewController = () => this.symbolsViewController
}
