/** @babel */

import {Emitter} from "atom"
import * as humanize from "humanize-plus"
import SymbolsView from "./symbolsView"
import {clientResolver} from "../../../atomts"
import {NavtoItem} from "typescript/lib/protocol"
import {Tag} from "./fileSymbolsTag"
import {debounce, Cancelable} from "lodash"

/**
 * this is a modified copy of symbols-view/lib/project-view.js
 * for support of searching project-symbols in typescript files,
 * utilizing the typescript service instead of ctag.
 */

export default class ProjectView extends SymbolsView {
  tags: Tag[]
  updatedTags: Emitter<{tags: Tag[]}> = new Emitter<{tags: Tag[]}>()
  loadTagsTask: Promise<Tag[]>
  search: string | undefined
  startTaskDelayed: ((searchValue: string) => void) & Cancelable

  constructor(stack: any) {
    super(stack, "Project has no tags file or it is empty", 10)
    this.startTaskDelayed = debounce(this.startTask.bind(this), 250)
  }

  destroy() {
    this.stopTask()
    this.updatedTags.dispose()
    return super.destroy()
  }

  toggle() {
    if (this.panel.isVisible()) {
      this.cancel()
    } else {
      this.populate()
      this.attach()
    }
  }

  async populate() {
    if (this.tags) {
      await this.selectListView.update({items: this.tags})
    }

    await this.selectListView.update({
      loadingMessage: "Loading project symbols\u2026",
      loadingBadge: 0,
    })

    let tagsRead = 0
    this.updatedTags.clear()
    this.updatedTags.on("tags", tags => {
      if (tags && tags.length > 0) {
        tagsRead += tags.length
        this.selectListView.update({loadingBadge: humanize.intComma(tagsRead)})
      } else {
        this.tags = []
        const message = this.getEmptyResultMessage()
        this.selectListView.update({
          loadingMessage: message,
          loadingBadge: null,
          items: this.tags,
        })
      }
    })

    this.updatedTags.emit("tags", this.tags)
  }

  stopTask() {
    if (this.startTaskDelayed && this.startTaskDelayed.cancel) {
      this.startTaskDelayed.cancel()
    }
    if (this.loadTagsTask) {
      // TODO cancel pending request -- would need Oberservable or similar instead of Promise
      // this.loadTagsTask.terminate();
    }
  }

  startTask(searchValue: string): void {
    // console.log('new request for query: "'+searchValue+'"...')
    this.stopTask()

    // NOTE need file path when querying tsserver's "navto"
    const filePath = this.getPath()
    if (filePath) {
      this.loadTagsTask = this.generate(filePath, searchValue).then(tags => {
        this.search = searchValue
        this.tags = tags
        const message: string | null = tags.length > 1 ? null : this.getEmptyResultMessage()
        this.selectListView.update({
          loadingMessage: message,
          loadingBadge: null,
          items: this.tags,
        })
        return tags
      })
    }
  }

  didChangeQuery(query: string) {
    if (query) {
      this.startTaskDelayed(query)
    } else {
      this.updatedTags.emit("tags", [])
    }
  }

  private getEmptyResultMessage() {
    return this.search ? "No symbols found" : "Please enter search value"
  }

  //////////////// copied from fileSymbolsView /////////////////////////////

  getEditor() {
    return atom.workspace.getActiveTextEditor()
  }

  getPath() {
    const editor = this.getEditor()
    if (editor) {
      return editor.getPath()
    }
    return undefined
  }

  /////////////// custom tag generation: use tsserver /////////////////////

  async generate(filePath: string, searchValue: string) {
    const navto = await this.getNavTo(filePath, searchValue)
    const tags: Tag[] = []
    if (navto && navto.length > 0) {
      this.parseNavTo(navto, tags)
    }
    return tags
  }

  private parseNavTo(navTree: NavtoItem | NavtoItem[], list: Tag[], parent?: Tag | null) {
    let tag: Tag | null
    let children: NavtoItem[] | null
    if (!Array.isArray(navTree)) {
      tag = new Tag(navTree, parent)
      list.push(tag)
      children = null
    } else {
      tag = null
      children = navTree
    }

    if (children) {
      for (let i = 0, size = children.length; i < size; ++i) {
        this.parseNavTo(children[i], list, tag)
      }
    }
  }

  private async getNavTo(filePath: string, query: string): Promise<NavtoItem[] | null> {
    try {
      const client = await clientResolver.get(filePath)
      await client.executeOpen({file: filePath})
      const navtoResult = await client.executeNavto({
        file: filePath,
        currentFileOnly: false,
        searchValue: query,
      })
      const navTo = navtoResult ? (navtoResult.body as NavtoItem[]) : void 0
      if (navTo) {
        return navTo
      }
    } catch (err) {
      console.error(err, filePath)
    }
    return null
  }
}
