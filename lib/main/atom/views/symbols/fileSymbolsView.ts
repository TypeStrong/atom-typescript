/** @babel */

import {CompositeDisposable, TextEditor} from "atom"
import SymbolsView from "./symbolsView"
import {match} from "fuzzaldrin"
import {ClientResolver} from "../../../../client/clientResolver"
import {NavigationTree} from "typescript/lib/protocol"
import {Tag} from "./fileSymbolsTag"

/**
 * this is a modified copy of symbols-view/lib/file-view.js
 * for support of searching file-symbols in typescript files,
 * utilizing the typescript service instead of ctag.
 */

export class FileView extends SymbolsView {
  private cachedTags: any
  private editorsSubscription: any
  private initialState: any

  constructor(stack: any, private clientResolver: ClientResolver) {
    super(stack)
    this.cachedTags = {}

    this.editorsSubscription = atom.workspace.observeTextEditors((editor: TextEditor) => {
      const removeFromCache = () => {
        const path = editor.getPath()
        if (path) {
          delete this.cachedTags[path]
        }
      }
      const editorSubscriptions = new CompositeDisposable()
      editorSubscriptions.add(editor.onDidChangeGrammar(removeFromCache))
      editorSubscriptions.add(editor.onDidSave(removeFromCache))
      editorSubscriptions.add((editor as any).onDidChangePath(removeFromCache))
      editorSubscriptions.add(editor.getBuffer().onDidReload(removeFromCache))
      editorSubscriptions.add(editor.getBuffer().onDidDestroy(removeFromCache))
      editor.onDidDestroy(() => {
        editorSubscriptions.dispose()
      })
    })
  }

  public destroy() {
    this.editorsSubscription.dispose()
    return super.destroy()
  }

  public elementForItem({position, name}: any) {
    // Style matched characters in search results
    const matches = match(name, this.selectListView.getFilterQuery())

    const li = document.createElement("li")
    li.classList.add("two-lines")

    const primaryLine = document.createElement("div")
    primaryLine.classList.add("primary-line")
    primaryLine.appendChild(SymbolsView.highlightMatches(this, name, matches))
    li.appendChild(primaryLine)

    const secondaryLine = document.createElement("div")
    secondaryLine.classList.add("secondary-line")
    secondaryLine.textContent = `Line ${position.row + 1}`
    li.appendChild(secondaryLine)

    return li
  }

  public didChangeSelection(item: any) {
    // NOTE uses the "parent" package's setting (i.e. from symbols-view):
    if (atom.config.get("symbols-view.quickJumpToFileSymbol") && item) {
      this.openTag(item)
    }
  }

  public async didCancelSelection() {
    await this.cancel()
    const editor = this.getEditor()
    if (this.initialState && editor) {
      this.deserializeEditorState(editor, this.initialState)
    }
    this.initialState = null
  }

  public async toggle() {
    if (this.panel.isVisible()) {
      await this.cancel()
    }
    const filePath = this.getPath()
    if (filePath) {
      const editor = this.getEditor()
      // NOTE uses the "parent" package's setting (i.e. from symbols-view):
      if (atom.config.get("symbols-view.quickJumpToFileSymbol") && editor) {
        this.initialState = this.serializeEditorState(editor)
      }
      this.populate(filePath)
      this.attach()
    }
  }

  public serializeEditorState(editor: TextEditor) {
    const editorElement = atom.views.getView(editor)
    const scrollTop = editorElement.getScrollTop()

    return {
      bufferRanges: editor.getSelectedBufferRanges(),
      scrollTop,
    }
  }

  public deserializeEditorState(editor: TextEditor, {bufferRanges, scrollTop}: any) {
    const editorElement = atom.views.getView(editor)
    ;(editor as any).setSelectedBufferRanges(bufferRanges)
    editorElement.setScrollTop(scrollTop)
  }

  public getEditor() {
    return atom.workspace.getActiveTextEditor()
  }

  public getPath() {
    const editor = this.getEditor()
    if (editor) {
      return editor.getPath()
    }
    return undefined
  }

  public getScopeName() {
    const editor = this.getEditor()
    if (editor && editor.getGrammar()) {
      return editor.getGrammar().scopeName
    }
    return undefined
  }

  private async populate(filePath: string) {
    const tags = this.cachedTags[filePath]
    if (tags) {
      await this.selectListView.update({items: tags})
    } else {
      await this.selectListView.update({
        items: [],
        loadingMessage: "Generating symbols\u2026",
      })
      await this.selectListView.update({
        items: await this.generateTags(filePath),
        loadingMessage: null,
      })
    }
  }

  private async generateTags(filePath: string) {
    // const generator = new TagGenerator(filePath, this.getScopeName());
    this.cachedTags[filePath] = await this.generate(filePath) // generator.generate();
    return this.cachedTags[filePath]
  }

  /////////////// custom tag generation: use tsserver /////////////////////

  private async generate(filePath: string) {
    const navtree = await this.getNavTree(filePath)
    const tags: Tag[] = []
    if (navtree && navtree.childItems) {
      // NOTE omit root NavigationTree tree element (which corresponds to the file itself)
      this.parseNavTree(navtree.childItems, tags)
    }
    return tags
  }

  private parseNavTree(
    navTree: NavigationTree | NavigationTree[],
    list: Tag[],
    parent?: Tag | null,
  ) {
    let tag: Tag | null
    let children: NavigationTree[] | null
    if (!Array.isArray(navTree)) {
      tag = new Tag(navTree, parent)
      list.push(tag)
      children = navTree.childItems ? navTree.childItems : null
    } else {
      tag = null
      children = navTree
    }

    if (children) {
      // sort children by their line-position
      children.sort((a, b) => a.spans[0].start.line - b.spans[0].start.line)
      for (let i = 0, size = children.length; i < size; ++i) {
        this.parseNavTree(children[i], list, tag)
      }
    }
  }

  // TODO optimize? when semantic-view is open, and has the current navTree -> use that instead of requesting it again?
  private async getNavTree(filePath: string): Promise<NavigationTree | null> {
    try {
      const client = await this.clientResolver.get(filePath)
      await client.executeOpen({file: filePath})
      const navtreeResult = await client.executeNavTree({file: filePath as string})
      const navTree = navtreeResult ? (navtreeResult.body as NavigationTree) : void 0
      if (navTree) {
        return navTree
      }
    } catch (err) {
      console.error(err, filePath)
    }
    return null
  }
}
