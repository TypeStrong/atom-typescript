import * as etch from "etch"
import {CompositeDisposable} from "atom"
import {MiniEditor} from "../components/miniEditor"

interface Props extends JSX.Props {
  validationMessage?: string
  title: string
  initialText: string
  selectAll: boolean
}

export interface Options {
  autoSelect: boolean
  title: string
  text: string
  onValidate: (newValue: string) => string
}

class RenameView implements JSX.ElementClass {
  public refs!: {
    editor: MiniEditor
    main: HTMLElement
  }

  constructor(public props: Props) {
    etch.initialize(this)
  }

  public async update(props: Partial<Props>) {
    this.props = {...this.props, ...props}
    await etch.update(this)
  }

  public render() {
    return (
      <div class="atomts-rename-view" ref="main">
        <div class="block">
          <div>
            <span ref="title">{this.props.title}</span>
            <span class="subtle-info-message">
              <span>Close this panel with </span>
              <span class="highlight">esc</span>
              <span> key. And commit with the </span>
              <span class="highlight">enter</span>
              <span> key.</span>
            </span>
          </div>
          <div class="find-container block">
            <div class="editor-container">
              <MiniEditor
                ref="editor"
                initialText={this.props.initialText}
                selectAll={this.props.selectAll}
              />
            </div>
          </div>
          {this.renderValidationMessage()}
        </div>
      </div>
    )
  }

  public async destroy() {
    await etch.destroy(this)
  }

  public focus() {
    return this.refs.editor.focus()
  }

  public getText() {
    return this.refs.editor.getModel().getText()
  }

  private renderValidationMessage(): JSX.Element | null {
    if (this.props.validationMessage !== undefined) {
      return <div class="highlight-error">{this.props.validationMessage}</div>
    }
    return null
  }
}

// Show the dialog and resolve the promise with the entered string
export async function showRenameDialog(options: Options): Promise<string | undefined> {
  const item = new RenameView({
    title: options.title,
    initialText: options.text,
    selectAll: options.autoSelect,
  })
  const panel = atom.workspace.addModalPanel({
    item,
    priority: 1000,
  })

  const currentFocus = document.activeElement as HTMLElement | void

  item.focus()

  const disposables = new CompositeDisposable()
  try {
    return await new Promise<string | undefined>(resolve => {
      disposables.add(
        atom.commands.add(item.refs.main, {
          "core:cancel": () => {
            resolve(undefined)
          },
          "core:confirm": () => {
            const newText = item.getText()
            const invalid = options.onValidate(newText)
            if (invalid) {
              item.update({validationMessage: invalid})
              return
            }
            resolve(newText)
          },
        }),
      )
    })
  } finally {
    panel.destroy()
    disposables.dispose()
    if (currentFocus) currentFocus.focus()
  }
}
