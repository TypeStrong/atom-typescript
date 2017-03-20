/** What gets passed into the handler */
export interface RequestOptions {
  activatedManually: boolean
  editor: AtomCore.IEditor
  bufferPosition: TextBuffer.IPoint // the position of the cursor
  prefix: string
  scopeDescriptor: { scopes: string[] }
}

/** The suggestion */
export interface Suggestion {
  // Either text or snippet is required
  text?: string
  snippet?: string

  displayText?: string
  iconHTML?: string

  // The contents of the editor right before the cursor that are going to be replaced
  replacementPrefix?: string

  // Left and right labels to show in the dropdown and their HTML versions
  rightLabel?: string
  rightLabelHTML?: string
  leftLabel?: string
  leftLabelHTML?: string

  type: string

  // Extra information shown at the bottom of the autocomplete dropdown for documentation, etc
  description?: string
  descriptionMoreURL?: string
}

/** What the provider needs to implement */
export interface Provider {
  inclusionPriority?: number
  excludeLowerPriority?: boolean
  suggestionPriority?: number
  selector: string
  disableForSelector?: string
  getSuggestions: (options: RequestOptions) => Promise<Suggestion[]>
  onDidInsertSuggestion?: (args: InsertArgs) => any
}

export interface InsertArgs {
  editor: AtomCore.IEditor,
  triggerPosition: TextBuffer.IPoint,
  suggestion: Suggestion
}
