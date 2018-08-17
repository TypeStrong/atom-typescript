import * as etch from "etch"
import {match} from "fuzzaldrin"

export interface Props extends JSX.Props {
  label: string
  query: string
}

export interface QueryMatch {
  text: string
  type?: "character-match"
}

export class HighlightComponent implements JSX.ElementClass {
  private matches: QueryMatch[]
  constructor(public props: Props) {
    this.matches = this.match(this.props)
    etch.initialize(this)
  }

  public async update(props: Partial<Props>) {
    this.props = {...this.props, ...props}
    this.matches = this.match(this.props)
    await etch.update(this)
  }

  public async destroy() {
    await etch.destroy(this)
  }

  public render(): JSX.Element {
    return (
      <span>
        {this.matches.map(m => (
          <span class={m.type}>{m.text}</span>
        ))}
      </span>
    )
  }

  private match(props: Props): QueryMatch[] {
    if (props.query) {
      return highlightMatches(props.label, props.query)
    }
    return [{text: props.label}]
  }
}

// extracted/adapted from symbols-view package (symbols-view.js::SymbolsView.highlightMatches)
export function highlightMatches(name: string, query: string): QueryMatch[] {
  let lastIndex: number = 0
  let matchedChars: string[] = [] // Build up a set of matched chars to be more semantic
  const queryMatches: QueryMatch[] = []

  const matches: number[] = match(name, query)
  let matchIndex: number
  for (matchIndex of matches) {
    if (matchIndex < 0) {
      continue // If marking up the basename, omit name matches
    }
    const unmatched = name.substring(lastIndex, matchIndex)
    if (unmatched) {
      if (matchedChars.length > 0) {
        queryMatches.push({text: matchedChars.join(""), type: "character-match"})
      }
      matchedChars = []
      queryMatches.push({text: unmatched})
    }
    matchedChars.push(name[matchIndex])
    lastIndex = matchIndex + 1
  }

  if (matchedChars.length > 0) {
    queryMatches.push({text: matchedChars.join(""), type: "character-match"})
  }

  // Remaining characters are plain text
  queryMatches.push({text: name.substring(lastIndex)})

  return queryMatches
}
