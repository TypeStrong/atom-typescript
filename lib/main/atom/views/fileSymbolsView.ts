/** @babel */

import {CompositeDisposable} from "atom"
import SymbolsView from "./symbolsView"
import {match} from "fuzzaldrin"
import {clientResolver} from "../../atomts"
import {NavigationTree} from "typescript/lib/protocol"

export class FileView extends SymbolsView {
  cachedTags: any
  editorsSubscription: any
  initialState: any

  constructor(stack: any) {
    super(stack)
    this.cachedTags = {}

    this.editorsSubscription = atom.workspace.observeTextEditors((editor: AtomCore.IEditor) => {
      const removeFromCache = () => {
        delete this.cachedTags[editor.getPath()]
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

  destroy() {
    this.editorsSubscription.dispose()
    return super.destroy()
  }

  elementForItem({position, name}: any) {
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

  didChangeSelection(item: any) {
    if (atom.config.get("symbols-view.quickJumpToFileSymbol") && item) {
      this.openTag(item)
    }
  }

  async didCancelSelection() {
    await this.cancel()
    const editor = this.getEditor()
    if (this.initialState && editor) {
      this.deserializeEditorState(editor, this.initialState)
    }
    this.initialState = null
  }

  async toggle() {
    if (this.panel.isVisible()) {
      await this.cancel()
    }
    const filePath = this.getPath()
    if (filePath) {
      const editor = this.getEditor()
      // if (atom.config.get('symbols-view.quickJumpToFileSymbol') && editor) {
      //   this.initialState = this.serializeEditorState(editor);
      // }
      this.populate(filePath)
      this.attach()
    }
  }

  serializeEditorState(editor: AtomCore.IEditor) {
    const editorElement = atom.views.getView(editor)
    const scrollTop = editorElement.getScrollTop()

    return {
      bufferRanges: editor.getSelectedBufferRanges(),
      scrollTop,
    }
  }

  deserializeEditorState(editor: AtomCore.IEditor, {bufferRanges, scrollTop}: any) {
    const editorElement = atom.views.getView(editor)
    ;(editor as any).setSelectedBufferRanges(bufferRanges)
    editorElement.setScrollTop(scrollTop)
  }

  getEditor() {
    return atom.workspace.getActiveTextEditor()
  }

  getPath() {
    if (this.getEditor()) {
      return this.getEditor().getPath()
    }
    return undefined
  }

  getScopeName() {
    if (this.getEditor() && this.getEditor().getGrammar()) {
      return this.getEditor().getGrammar().scopeName
    }
    return undefined
  }

  async populate(filePath: string) {
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

  async generateTags(filePath: string) {
    // const generator = new TagGenerator(filePath, this.getScopeName());
    this.cachedTags[filePath] = await this.generate(filePath) //generator.generate();
    return this.cachedTags[filePath]
  }

  async generate(filePath: string) {
    let navtree = await this.getNavTree(filePath)
    let tags: Array<Tag> = []
    if (navtree && navtree.childItems) {
      //NOTE omit root NavigationTree tree element (which corresponds to the file itself)
      this.parseNavTree(navtree.childItems, tags)
    }
    return tags
  }

  private parseNavTree(
    navTree: NavigationTree | Array<NavigationTree>,
    list: Array<Tag>,
    parent?: Tag | null,
  ) {
    let tag: Tag | null
    let children: Array<NavigationTree> | null
    if (!Array.isArray(navTree)) {
      tag = new Tag(navTree, parent)
      list.push(tag)
      children = navTree.childItems ? navTree.childItems : null
    } else {
      tag = null
      children = navTree
    }

    if (children) {
      //sort children by their line-position
      children.sort((a, b) => a.spans[0].start.line - b.spans[0].start.line)
      for (let i = 0, size = children.length; i < size; ++i) {
        this.parseNavTree(children[i], list, tag)
      }
    }
  }

  private async getNavTree(filePath: string): Promise<NavigationTree | null> {
    try {
      const client = await clientResolver.get(filePath)
      await client.executeOpen({file: filePath})
      const navtreeResult = await client.executeNavTree({file: filePath as string})
      const navTree = navtreeResult ? navtreeResult.body as NavigationTree : void 0
      if (navTree) {
        return navTree
      }
    } catch (err) {
      console.error(err, filePath)
    }
    return null
  }
}

export class Tag {
  position: {row: number; column: number}
  name: string
  type: string
  parent: any
  constructor(navTree: NavigationTree, parent?: Tag | null) {
    this.name = navTree.text
    this.type = this.getType(navTree.kind)

    const start = navTree.spans[0].start
    this.position = {row: start.line - 1, column: start.offset}
    this.parent = parent ? parent : null
  }

  getType(kind: string): string {
    //FIXME need to convert from ctag
    // switch(kind){
    //   case 'class':
    //   case 'struct':
    //   case 'interface':
    //   case 'enum':
    //   case 'typedef':
    //   case 'macro':
    //   case 'union':
    //   case 'module':
    //   case 'namespace':
    //     return 'class';
    //   case 'type':
    //   case 'variable':
    //   case 'field':
    //   case 'member':
    //   case 'var':
    //   case 'property':
    //   case 'alias':
    //   case 'let':
    //     return 'variable';
    //   case 'const':
    //     return 'const';
    //   case 'function':
    //   case 'constructor':
    //   case 'method':
    //   case 'setter':
    //   case 'getter':
    //     return 'function';
    // }
    return kind
  }
}
