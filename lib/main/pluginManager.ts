import * as Atom from "atom"
import {CompositeDisposable} from "atom"
import {BusySignalService, DatatipService, SignatureHelpRegistry} from "atom/ide"
import {IndieDelegate} from "atom/linter"
import {StatusBar} from "atom/status-bar"
import {debounce} from "lodash"
import * as path from "path"
import {ClientResolver} from "../client"
import {handlePromise} from "../utils"
import {AutocompleteProvider} from "./atom/autoCompleteProvider"
import {CodeActionsProvider, CodefixProvider, IntentionsProvider} from "./atom/codefix"
import {registerCommands} from "./atom/commands"
import {StatusPanel} from "./atom/components/statusPanel"
import {TSDatatipProvider} from "./atom/datatipProvider"
import {EditorPositionHistoryManager} from "./atom/editorPositionHistoryManager"
import {getHyperclickProvider} from "./atom/hyperclickProvider"
import {OccurrenceManager} from "./atom/occurrence/manager"
import {SigHelpManager} from "./atom/sigHelp/manager"
import {TSSigHelpProvider} from "./atom/sigHelpProvider"
import {TooltipManager} from "./atom/tooltips/manager"
import {spanToRange, TextSpan} from "./atom/utils"
import {SemanticViewController} from "./atom/views/outline/semanticViewController"
import {SymbolsViewController} from "./atom/views/symbols/symbolsViewController"
import {ErrorPusher} from "./errorPusher"
import {State} from "./packageState"
import {TypescriptBuffer} from "./typescriptBuffer"
import {TypescriptEditorPane} from "./typescriptEditorPane"

export type WithTypescriptBuffer = <T>(
  filePath: string,
  action: (buffer: TypescriptBuffer) => Promise<T>,
) => Promise<T>

export interface Change extends TextSpan {
  newText: string
}
export interface Edit {
  fileName: string
  textChanges: ReadonlyArray<Readonly<Change>>
}
export type Edits = ReadonlyArray<Readonly<Edit>>
export type ApplyEdits = (edits: Edits) => Promise<void>
export type ReportBusyWhile = <T>(title: string, generator: () => Promise<T>) => Promise<T>

export class PluginManager {
  // components
  private subscriptions: CompositeDisposable
  private clientResolver: ClientResolver
  private statusPanel: StatusPanel
  private errorPusher: ErrorPusher
  private codefixProvider: CodefixProvider
  private semanticViewController: SemanticViewController
  private symbolsViewController: SymbolsViewController
  private editorPosHist: EditorPositionHistoryManager
  private readonly panes: TypescriptEditorPane[] = [] // TODO: do we need it?
  private tooltipManager: TooltipManager
  private usingBuiltinTooltipManager = true
  private sigHelpManager: SigHelpManager
  private usingBuiltinSigHelpManager = true
  private occurrenceManager: OccurrenceManager
  private pending = new Set<{title: string}>()
  private busySignalService?: BusySignalService

  public constructor(state?: Partial<State>) {
    this.subscriptions = new CompositeDisposable()

    this.clientResolver = new ClientResolver(this.reportBusyWhile)
    this.subscriptions.add(this.clientResolver)

    this.statusPanel = new StatusPanel()
    this.subscriptions.add(this.statusPanel)

    this.errorPusher = new ErrorPusher()
    this.subscriptions.add(this.errorPusher)

    // NOTE: This has to run before withTypescriptBuffer is used to populate this.panes
    this.subscribeEditors()

    this.codefixProvider = new CodefixProvider(
      this.clientResolver,
      this.errorPusher,
      this.applyEdits,
    )
    this.subscriptions.add(this.codefixProvider)

    this.semanticViewController = new SemanticViewController(this.withTypescriptBuffer)
    this.subscriptions.add(this.semanticViewController)

    this.symbolsViewController = new SymbolsViewController(this)
    this.subscriptions.add(this.symbolsViewController)

    this.editorPosHist = new EditorPositionHistoryManager(state && state.editorPosHistState)
    this.subscriptions.add(this.editorPosHist)

    this.tooltipManager = new TooltipManager(this.getClient)
    this.subscriptions.add(this.tooltipManager)

    this.sigHelpManager = new SigHelpManager(this)
    this.subscriptions.add(this.sigHelpManager)

    this.occurrenceManager = new OccurrenceManager(this.getClient)
    this.subscriptions.add(this.occurrenceManager)

    // Register the commands
    this.subscriptions.add(registerCommands(this))
  }

  public destroy() {
    this.subscriptions.dispose()
  }

  public serialize(): State {
    return {
      version: "0.1",
      editorPosHistState: this.editorPosHist.serialize(),
    }
  }

  public consumeLinter(register: (opts: {name: string}) => IndieDelegate) {
    const linter = register({
      name: "TypeScript",
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

  public consumeDatatipService(datatip: DatatipService) {
    if (atom.config.get("atom-typescript.preferBuiltinTooltips")) return
    const disp = datatip.addProvider(new TSDatatipProvider(this.getClient))
    this.subscriptions.add(disp)
    this.tooltipManager.dispose()
    this.usingBuiltinTooltipManager = false
    return disp
  }

  public consumeSigHelpService(registry: SignatureHelpRegistry): void | Atom.DisposableLike {
    if (atom.config.get("atom-typescript.preferBuiltinSigHelp")) return
    const disp = registry(new TSSigHelpProvider(this.getClient, this.withTypescriptBuffer))
    this.subscriptions.add(disp)
    this.sigHelpManager.dispose()
    this.usingBuiltinSigHelpManager = false
    return disp
  }

  public consumeBusySignal(busySignalService: BusySignalService): void | Atom.DisposableLike {
    if (atom.config.get("atom-typescript.preferBuiltinBusySignal")) return
    this.busySignalService = busySignalService
    const disp = {
      dispose: () => {
        if (this.busySignalService) this.busySignalService.dispose()
        this.busySignalService = undefined
      },
    }
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
    return getHyperclickProvider(this.clientResolver, this.editorPosHist)
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

  public killAllServers = () => this.clientResolver.killAllServers()

  public getStatusPanel = () => this.statusPanel

  public withTypescriptBuffer: WithTypescriptBuffer = async (filePath, action) => {
    const normalizedFilePath = path.normalize(filePath)
    const pane = this.panes.find(p => p.buffer.getPath() === normalizedFilePath)
    if (pane) return action(pane.buffer)

    // no open buffer
    const buffer = await Atom.TextBuffer.load(normalizedFilePath)
    try {
      const tsbuffer = TypescriptBuffer.create(buffer, fp => this.clientResolver.get(fp))
      return await action(tsbuffer)
    } finally {
      if (buffer.isModified()) await buffer.save()
      buffer.destroy()
    }
  }

  public reportBusyWhile: ReportBusyWhile = async (title, generator) => {
    if (this.busySignalService) {
      return this.busySignalService.reportBusyWhile(title, generator)
    } else {
      const event = {title}
      try {
        this.pending.add(event)
        await this.statusPanel.throttledUpdate({pending: Array.from(this.pending)})
        return await generator()
      } finally {
        this.pending.delete(event)
        await this.statusPanel.throttledUpdate({pending: Array.from(this.pending)})
      }
    }
  }

  public applyEdits: ApplyEdits = async edits =>
    void Promise.all(
      edits.map(edit =>
        this.withTypescriptBuffer(edit.fileName, async buffer => {
          buffer.buffer.transact(() => {
            const changes = edit.textChanges
              .map(e => ({range: spanToRange(e), newText: e.newText}))
              .sort((a, b) => b.range.compare(a.range))
            for (const change of changes) {
              buffer.buffer.setTextInRange(change.range, change.newText)
            }
          })
          return buffer.flush()
        }),
      ),
    )

  public async showTooltipAt(ed: Atom.TextEditor): Promise<void> {
    if (this.usingBuiltinTooltipManager) await this.tooltipManager.showExpressionAt(ed)
    else await atom.commands.dispatch(atom.views.getView(ed), "datatip:toggle")
  }

  public async showSigHelpAt(ed: Atom.TextEditor): Promise<void> {
    if (this.usingBuiltinSigHelpManager) await this.sigHelpManager.showTooltipAt(ed)
    else await atom.commands.dispatch(atom.views.getView(ed), "signature-help:show")
  }

  public hideSigHelpAt(ed: Atom.TextEditor): boolean {
    if (this.usingBuiltinSigHelpManager) return this.sigHelpManager.hideTooltipAt(ed)
    else return false
  }

  public getSemanticViewController = () => this.semanticViewController

  public getSymbolsViewController = () => this.symbolsViewController

  public getEditorPositionHistoryManager = () => this.editorPosHist

  private subscribeEditors() {
    let activePane: TypescriptEditorPane | undefined

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
            onSave: debounce((pane: TypescriptEditorPane) => {
              if (!pane.client) {
                return
              }

              const files: string[] = []
              for (const p of this.panes.sort((a, b) => a.activeAt - b.activeAt)) {
                const filePath = p.buffer.getPath()
                if (filePath !== undefined && p.isTypescript && p.client === pane.client) {
                  files.push(filePath)
                }
              }

              handlePromise(pane.client.execute("geterr", {files, delay: 100}))
            }, 50),
            statusPanel: this.statusPanel,
          }),
        )
      }),
    )

    this.subscriptions.add(
      atom.workspace.observeActiveTextEditor((editor?: Atom.TextEditor) => {
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
}
