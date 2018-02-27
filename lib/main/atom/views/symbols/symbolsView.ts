import * as path from "path"
import {Point} from "atom"
import {isFileSync, readFileSync} from "../../utils/fs"
import {match} from "fuzzaldrin"
import SelectListView = require("atom-select-list")

/**
 * this is a slightly modified copy of symbols-view/lib/symbols-view.js
 * for support of searching file-symbols in typescript files.
 */

export default class SymbolsView {
  public selectListView: any
  public element: any
  public panel: any
  private isCanceling: boolean
  private previouslyFocusedElement: HTMLElement | null = null
  public static highlightMatches(_context: any, name: any, matches: any, offsetIndex?: any) {
    // tslint:disable-line
    if (!offsetIndex) {
      offsetIndex = 0
    }
    let lastIndex = 0
    let matchedChars = [] // Build up a set of matched chars to be more semantic
    const fragment = document.createDocumentFragment()

    let matchIndex: any
    for (matchIndex of Array.from(matches)) {
      matchIndex -= offsetIndex
      if (matchIndex < 0) {
        continue // If marking up the basename, omit name matches
      }
      const unmatched = name.substring(lastIndex, matchIndex)
      if (unmatched) {
        if (matchedChars.length) {
          const span = document.createElement("span")
          span.classList.add("character-match")
          span.textContent = matchedChars.join("")
          fragment.appendChild(span)
        }
        matchedChars = []
        fragment.appendChild(document.createTextNode(unmatched))
      }
      matchedChars.push(name[matchIndex])
      lastIndex = matchIndex + 1
    }

    if (matchedChars.length) {
      const span = document.createElement("span")
      span.classList.add("character-match")
      span.textContent = matchedChars.join("")
      fragment.appendChild(span)
    }

    // Remaining characters are plain text
    fragment.appendChild(document.createTextNode(name.substring(lastIndex)))

    return fragment
  }

  constructor(public stack: any, emptyMessage = "No symbols found", maxResults?: number) {
    this.selectListView = new SelectListView({
      maxResults,
      emptyMessage,
      items: [],
      filterKeyForItem: (item: any) => item.name,
      elementForItem: this.elementForItem.bind(this),
      didChangeSelection: this.didChangeSelection.bind(this),
      didConfirmSelection: this.didConfirmSelection.bind(this),
      didConfirmEmptySelection: this.didConfirmEmptySelection.bind(this),
      didCancelSelection: this.didCancelSelection.bind(this),
      didChangeQuery: this.didChangeQuery.bind(this),
    })
    this.element = this.selectListView.element
    this.element.classList.add("symbols-view")
    this.panel = atom.workspace.addModalPanel({item: this, visible: false})
  }

  public async destroy() {
    await this.cancel()
    this.panel.destroy()
    return this.selectListView.destroy()
  }

  public getFilterKey() {
    return "name"
  }

  public elementForItem({position, name, file, directory}: any) {
    // Style matched characters in search results
    const matches = match(name, this.selectListView.getFilterQuery())

    if (atom.project.getPaths().length > 1) {
      file = path.join(path.basename(directory), file)
    }

    const li = document.createElement("li")
    li.classList.add("two-lines")

    const primaryLine = document.createElement("div")
    primaryLine.classList.add("primary-line")
    if (position) {
      primaryLine.textContent = `${name}:${position.row + 1}`
    } else {
      primaryLine.appendChild(SymbolsView.highlightMatches(this, name, matches))
    }
    li.appendChild(primaryLine)

    const secondaryLine = document.createElement("div")
    secondaryLine.classList.add("secondary-line")
    secondaryLine.textContent = file
    li.appendChild(secondaryLine)

    return li
  }

  public async cancel() {
    if (!this.isCanceling) {
      this.isCanceling = true
      await this.selectListView.update({items: []})
      this.panel.hide()
      if (this.previouslyFocusedElement) {
        this.previouslyFocusedElement.focus()
        this.previouslyFocusedElement = null
      }
      this.isCanceling = false
    }
  }

  public didCancelSelection() {
    this.cancel()
  }

  public didConfirmEmptySelection() {
    this.cancel()
  }

  public async didConfirmSelection(tag: any) {
    if (tag.file && !isFileSync(path.join(tag.directory, tag.file))) {
      await this.selectListView.update({errorMessage: "Selected file does not exist"})
      setTimeout(() => {
        this.selectListView.update({errorMessage: null})
      }, 2000)
    } else {
      await this.cancel()
      this.openTag(tag)
    }
  }

  public didChangeSelection(_tag: any) {
    // no-op
  }

  public didChangeQuery(_query: string) {
    // no-op
  }

  public openTag(tag: any) {
    const editor = atom.workspace.getActiveTextEditor()
    let previous
    if (editor) {
      previous = {
        editorId: editor.id,
        position: editor.getCursorBufferPosition(),
        file: editor.getURI(),
      }
    }

    let {position} = tag
    if (!position) {
      position = this.getTagLine(tag)
    }
    if (tag.file) {
      atom.workspace.open(path.join(tag.directory, tag.file)).then(() => {
        if (position) {
          return this.moveToPosition(position)
        }
        return undefined
      })
    } else if (position && previous && !previous.position.isEqual(position)) {
      this.moveToPosition(position)
    }

    this.stack.push(previous)
  }

  public moveToPosition(position: any, beginningOfLine?: any) {
    const editor = atom.workspace.getActiveTextEditor()
    if (beginningOfLine == null) {
      beginningOfLine = true
    }
    if (editor) {
      editor.setCursorBufferPosition(position, {autoscroll: false})
      if (beginningOfLine) {
        editor.moveToFirstCharacterOfLine()
      }
      editor.scrollToCursorPosition({center: true})
    }
  }

  public attach() {
    this.previouslyFocusedElement = document.activeElement as HTMLElement
    this.panel.show()
    this.selectListView.reset()
    this.selectListView.focus()
  }

  private getTagLine(tag: any) {
    if (!tag) {
      return undefined
    }

    if (tag.lineNumber) {
      return new Point(tag.lineNumber - 1, 0)
    }

    // Remove leading /^ and trailing $/
    if (!tag.pattern) {
      return undefined
    }
    const pattern = tag.pattern.replace(/(^\/\^)|(\$\/$)/g, "").trim()

    if (!pattern) {
      return undefined
    }
    const file = path.join(tag.directory, tag.file)
    if (!isFileSync(file)) {
      return undefined
    }
    const iterable = readFileSync(file, "utf8").split("\n")
    for (let index = 0; index < iterable.length; index++) {
      const line = iterable[index]
      if (pattern === line.trim()) {
        return new Point(index, 0)
      }
    }

    return undefined
  }
}
