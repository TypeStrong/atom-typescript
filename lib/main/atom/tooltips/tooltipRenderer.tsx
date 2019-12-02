export async function renderTooltip(
  data: protocol.QuickInfoResponseBody | undefined,
  etch: any,
  codeRenderer?: (code: string) => Promise<JSX.Element>,
) {
  if (data === undefined) return null

  const codeText = data.displayString.replace(/^\(.+?\)\s+/, "")
  const code = codeRenderer ? (
    await codeRenderer(codeText)
  ) : (
    <div className="atom-typescript-tooltip-tooltip-code">{codeText}</div>
  )

  const kind = (
    <div className="atom-typescript-datatip-tooltip-kind">
      {data.kind}
      {data.kindModifiers ? <i> ({data.kindModifiers})</i> : null}
    </div>
  )

  const tags = data.tags.map(tag => {
    const tagClass =
      `atom-typescript-datatip-tooltip-doc-tag ` +
      `atom-typescript-datatip-tooltip-doc-tag-name-${tag.name}`
    const tagText = formatTagText(etch, tag.text)
    return (
      <div className={tagClass}>
        <span className="atom-typescript-datatip-tooltip-doc-tag-name">{tag.name}</span> {tagText}
      </div>
    )
  })

  const docs = (
    <div className="atom-typescript-datatip-tooltip-doc">
      {data.documentation}
      {tags}
    </div>
  )

  return [code, kind, docs]
}

function formatTagText(etch: any, tagText?: string) {
  if (tagText === undefined) return null

  const [, firstWord, restOfText] = /^\s*(\S*)(.*)$/.exec(tagText)!
  return (
    <span className="atom-typescript-datatip-tooltip-doc-tag-text">
      <span className="atom-typescript-datatip-tooltip-doc-tag-text-first-word">{firstWord}</span>
      {restOfText}
    </span>
  )
}
