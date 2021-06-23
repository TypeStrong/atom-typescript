import * as Atom from "atom"
import {CompositeDisposable} from "atom"
import {BusySignalService, DatatipService, SignatureHelpRegistry} from "atom-ide-base"
import {IndieDelegate} from "atom/linter"
import {StatusBar} from "atom/status-bar"
import {throttle} from "lodash"
import * as path from "path"
import {ClientResolver} from "../client"
import {handlePromise} from "../utils"
import {getCodeActionsProvider} from "./atom-ide/codeActionsProvider"
import {getCodeHighlightProvider} from "./atom-ide/codeHighlightProvider"
import {TSDatatipProvider} from "./atom-ide/datatipProvider"
import {getDefinitionProvider} from "./atom-ide/definitionsProvider"
import {getFindReferencesProvider} from "./atom-ide/findReferencesProvider"
import {getHyperclickProvider} from "./atom-ide/hyperclickProvider"
import {getOutlineProvider} from "./atom-ide/outlineProvider"
import {TSSigHelpProvider} from "./atom-ide/sigHelpProvider"
import {AutocompleteProvider} from "./atom/autoCompleteProvider"
import {CodefixProvider} from "./atom/codefix"
import {
  getIntentionsHighlightsProvider,
  getIntentionsProvider,
} from "./atom/codefix/intentionsProvider"
import {registerCommands} from "./atom/commands"
import {StatusPanel, TBuildStatus, TProgress} from "./atom/components/statusPanel"
import {EditorPositionHistoryManager} from "./atom/editorPositionHistoryManager"
import {OccurrenceManager} from "./atom/occurrence/manager"
import {SigHelpManager} from "./atom/sigHelp/manager"
import {TooltipManager} from "./atom/tooltips/manager"
import {isTypescriptEditorWithPath, spanToRange, TextSpan} from "./atom/utils"
import {SemanticViewController} from "./atom/views/outline/semanticViewController"
import {SymbolsViewController} from "./atom/views/symbols/symbolsViewController"
import {ErrorPusher} from "./errorPusher"
import {State} from "./packageState"
import {TypescriptEditorPane} from "./typescriptEditorPane"

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
  private tooltipManager: TooltipManager
  private usingBuiltinTooltipManager = true
  private sigHelpManager: SigHelpManager
  private usingBuiltinSigHelpManager = true
  private occurrenceManager: OccurrenceManager
  private pending = new Set<{title: string}>()
  private busySignalService?: BusySignalService
  private typescriptPaneFactory: (editor: Atom.TextEditor) => TypescriptEditorPane

  public constructor(state?: Partial<State>) {
    this.subscriptions = new CompositeDisposable()

    this.clientResolver = new ClientResolver(this.reportBusyWhile)
    this.subscriptions.add(this.clientResolver)

    this.statusPanel = new StatusPanel()
    this.subscriptions.add(this.statusPanel)

    this.errorPusher = new ErrorPusher()
    this.subscriptions.add(this.errorPusher)

    this.codefixProvider = new CodefixProvider(
      this.clientResolver,
      this.errorPusher,
      this.applyEdits,
    )
    this.subscriptions.add(this.codefixProvider)

    this.semanticViewController = new SemanticViewController(this.getClient)
    this.subscriptions.add(this.semanticViewController)

    this.editorPosHist = new EditorPositionHistoryManager(state && state.editorPosHistState)
    this.subscriptions.add(this.editorPosHist)

    this.symbolsViewController = new SymbolsViewController({
      histGoForward: this.histGoForward,
      getClient: this.getClient,
    })
    this.subscriptions.add(this.symbolsViewController)

    this.tooltipManager = new TooltipManager(this.getClient)
    this.subscriptions.add(this.tooltipManager)

    this.sigHelpManager = new SigHelpManager({
      getClient: this.getClient,
    })
    this.subscriptions.add(this.sigHelpManager)

    this.occurrenceManager = new OccurrenceManager(this.getClient)
    this.subscriptions.add(this.occurrenceManager)

    this.typescriptPaneFactory = TypescriptEditorPane.createFactory({
      clearFileErrors: this.clearFileErrors,
      getClient: this.getClient,
      reportBuildStatus: this.reportBuildStatus,
      reportClientInfo: this.reportClientInfo,
    })
    this.subscribeEditors()

    // Register the commands
    this.subscriptions.add(
      registerCommands({
        getClient: this.getClient,
        applyEdits: this.applyEdits,
        clearErrors: this.clearErrors,
        killAllServers: this.killAllServers,
        reportProgress: this.reportProgress,
        reportBuildStatus: this.reportBuildStatus,
        toggleSemanticViewController: () => {
          handlePromise(this.semanticViewController.toggle())
        },
        toggleFileSymbolsView: (ed) => {
          this.symbolsViewController.toggleFileView(ed)
        },
        toggleProjectSymbolsView: (ed) => {
          this.symbolsViewController.toggleProjectView(ed)
        },
        histGoForward: this.histGoForward,
        histGoBack: () => this.editorPosHist.goBack(),
        histShowHistory: () => this.editorPosHist.showHistory(),
        showTooltipAt: this.showTooltipAt,
        showSigHelpAt: this.showSigHelpAt,
        hideSigHelpAt: this.hideSigHelpAt,
        rotateSigHelp: this.rotateSigHelp,
      }),
    )
  }

  public destroy() {
    this.subscriptions.dispose()
    for (const ed of atom.workspace.getTextEditors()) {
      const pane = TypescriptEditorPane.lookupPane(ed)
      if (pane) pane.destroy()
    }
    TypescriptEditorPane.clearAllCache()
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

    this.subscriptions.add(
      this.clientResolver.on("diagnostics", ({type, filePath, diagnostics}) => {
        this.errorPusher.setErrors(type, filePath, diagnostics)
      }),
    )
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
    if (atom.config.get("atom-typescript").preferBuiltinTooltips) return
    const disp = datatip.addProvider(new TSDatatipProvider(this.getClient))
    this.subscriptions.add(disp)
    this.tooltipManager.dispose()
    this.usingBuiltinTooltipManager = false
    return disp
  }

  public consumeSigHelpService(registry: SignatureHelpRegistry): void | Atom.DisposableLike {
    if (atom.config.get("atom-typescript").preferBuiltinSigHelp) return
    const provider = new TSSigHelpProvider(this.getClient)
    const disp = registry(provider)
    this.subscriptions.add(disp, provider)
    this.sigHelpManager.dispose()
    this.usingBuiltinSigHelpManager = false
    return disp
  }

  public consumeBusySignal(busySignalService: BusySignalService): void | Atom.DisposableLike {
    if (atom.config.get("atom-typescript").preferBuiltinBusySignal) return
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
    return [new AutocompleteProvider(this.getClient, this.applyEdits)]
  }

  public provideIntentions() {
    return getIntentionsProvider(this.codefixProvider)
  }

  public provideIntentionsHighlight() {
    return getIntentionsHighlightsProvider(this.codefixProvider)
  }

  public provideCodeActions() {
    return getCodeActionsProvider(this.codefixProvider)
  }

  public provideHyperclick() {
    return getHyperclickProvider(this.getClient, this.histGoForward)
  }

  public provideReferences() {
    return getFindReferencesProvider(this.getClient)
  }

  public provideOutlines() {
    return getOutlineProvider(this.getClient)
  }

  public provideDefinitions() {
    if (atom.config.get("atom-typescript").disableAtomIdeDefinitions) return
    return getDefinitionProvider(this.getClient)
  }

  public provideCodeHighlight() {
    if (atom.config.get("atom-typescript").preferBuiltinOccurrenceHighlight) return
    this.occurrenceManager.dispose()
    return getCodeHighlightProvider(this.getClient)
  }

  private clearErrors = () => {
    this.errorPusher.clear()
  }

  private clearFileErrors = (filePath: string) => {
    this.errorPusher.clearFileErrors(filePath)
  }

  private getClient = async (filePath: string) => {
    return this.clientResolver.get(filePath)
  }

  private killAllServers = () => {
    handlePromise(this.clientResolver.restartAllServers())
  }

  private withBuffer = async <T>(
    filePath: string,
    action: (buffer: Atom.TextBuffer) => Promise<T>,
  ) => {
    const normalizedFilePath = path.normalize(filePath)
    const ed = atom.workspace.getTextEditors().find((p) => p.getPath() === normalizedFilePath)

    // found open buffer
    if (ed) return action(ed.getBuffer())

    // no open buffer
    const buffer = await Atom.TextBuffer.load(normalizedFilePath)
    try {
      return await action(buffer)
    } finally {
      if (buffer.isModified()) await buffer.save()
      buffer.destroy()
    }
  }

  private reportBusyWhile: ReportBusyWhile = async (title, generator) => {
    if (this.busySignalService) {
      return this.busySignalService.reportBusyWhile(title, generator)
    } else {
      const event = {title}
      try {
        this.pending.add(event)
        this.drawPending(Array.from(this.pending))
        return await generator()
      } finally {
        this.pending.delete(event)
        this.drawPending(Array.from(this.pending))
      }
    }
  }

  private reportProgress = (progress: TProgress) => {
    handlePromise(this.statusPanel.update({progress}))
  }

  private reportBuildStatus = (buildStatus: TBuildStatus | undefined) => {
    handlePromise(this.statusPanel.update({buildStatus}))
  }

  private reportClientInfo = (info: {clientVersion: string; tsConfigPath: string | undefined}) => {
    handlePromise(this.statusPanel.update(info))
  }

  private applyEdits: ApplyEdits = async (edits) =>
    void Promise.all(
      edits.map((edit) =>
        this.withBuffer(edit.fileName, async (buffer) => {
          buffer.transact(() => {
            const changes = edit.textChanges
              .map((e) => ({range: spanToRange(e), newText: e.newText}))
              .reverse() // NOTE: needs reverse for cases where ranges are same for two changes
              .sort((a, b) => b.range.compare(a.range))
            for (const change of changes) {
              buffer.setTextInRange(change.range, change.newText)
            }
          })
        }),
      ),
    )

  private showTooltipAt = async (ed: Atom.TextEditor): Promise<void> => {
    if (this.usingBuiltinTooltipManager) this.tooltipManager.showExpressionAt(ed)
    else await atom.commands.dispatch(atom.views.getView(ed), "datatip:toggle")
  }

  private showSigHelpAt = async (ed: Atom.TextEditor): Promise<void> => {
    if (this.usingBuiltinSigHelpManager) await this.sigHelpManager.showTooltipAt(ed)
    else await atom.commands.dispatch(atom.views.getView(ed), "signature-help:show")
  }

  private hideSigHelpAt = (ed: Atom.TextEditor): boolean => {
    if (this.usingBuiltinSigHelpManager) return this.sigHelpManager.hideTooltipAt(ed)
    else return false
  }

  private rotateSigHelp = (ed: Atom.TextEditor, shift: number): boolean => {
    if (this.usingBuiltinSigHelpManager) return this.sigHelpManager.rotateSigHelp(ed, shift)
    else return false
  }

  private histGoForward: EditorPositionHistoryManager["goForward"] = (ed, opts) => {
    return this.editorPosHist.goForward(ed, opts)
  }

  private subscribeEditors() {
    this.subscriptions.add(
      atom.workspace.observeTextEditors((editor: Atom.TextEditor) => {
        this.typescriptPaneFactory(editor)
      }),
      atom.workspace.onDidChangeActiveTextEditor((ed) => {
        if (ed && isTypescriptEditorWithPath(ed)) {
          handlePromise(this.statusPanel.show())
          const tep = TypescriptEditorPane.lookupPane(ed)
          if (tep) tep.didActivate()
        } else handlePromise(this.statusPanel.hide())
      }),
    )
  }

  // tslint:disable-next-line:member-ordering
  private drawPending = throttle(
    (pending: Array<{title: string}>) => handlePromise(this.statusPanel.update({pending})),
    100,
    {leading: false},
  )
}
