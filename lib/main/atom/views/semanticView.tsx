import atomUtils = require("../utils");
import * as sp from "atom-space-pen-views";
import * as view from "./view";
import {clientResolver} from "../../atomts"
import * as dom from "jsx-render-dom"
import { TypescriptBuffer } from '../../typescriptBuffer';

/**
 * Eventually
 */
namespace rts {
    /** 0 based length */
    export function indent(indent: number) {
        return Array(indent + 1).join().split('').map(i => "\u00a0\u00a0\u00a0\u00a0");
    }
}

//TODO extract?
interface Position {
  line: number;
  offset: number;
}
interface SemanticTreeNode {
  text: string;
  kind: string;
  kindModifiers: string;
  spans: Array<{start: Position, end: Position}>;
  childItems?: Array<SemanticTreeNode>;
}

export interface TypescriptFileBuffer {
  buffer: TypescriptBuffer;
  isOpen: boolean;
}

class MyComponent {//React.Component<Props, State>{

    editor: AtomCore.IEditor;
    ast: SemanticTreeNode | null;
    getTypescriptBuffer: (filePath: string) => Promise<TypescriptFileBuffer>;
    root: HTMLElement;

    constructor(getTypescriptBuffer: {getTypescriptBuffer: (filePath: string) => Promise<TypescriptFileBuffer>}){
        this.getTypescriptBuffer = getTypescriptBuffer.getTypescriptBuffer;
        this.ast = null;
    }

    setState(ast?: SemanticTreeNode | null, editor?: AtomCore.IEditor){

      if(typeof editor !== 'undefined')
        this.editor = editor;

      if(typeof ast !== 'undefined'){
        this.ast = ast;
        this._render();
      }
    }

    forceUpdate(){
      //TODO?
    }

    loadAst(buffer: TypescriptFileBuffer, filePath?: string) {
      filePath = filePath? filePath : this.editor.getPath();
      buffer.buffer.getClient(filePath).then(client => client.executeNavTree({file: filePath as string}).then(navtree => {
          let ast = navtree? navtree.body as SemanticTreeNode : void(0);
          if(ast){
            this.setState(ast);
          }
        }).catch(err => console.error(err, filePath))
      );
    }

    componentDidMount() {
        // We listen to a few things

        // Editor scrolling
        var editorScrolling: AtomCore.Disposable;
        // Editor changing
        var editorChanging: AtomCore.Disposable;

        let subscribeToEditor = (editor: AtomCore.IEditor) => {
            this.setState(void(0), editor);

            //set AST -> {"seq":1,"type":"quickinfo","command":"navtree","arguments":{"file":<file-path>}}
            const filePath = editor.getPath();
            this.getTypescriptBuffer(filePath).then(fbuffer => {
              let buffer = fbuffer as TypescriptFileBuffer;
              if(buffer.isOpen){
                this.loadAst(buffer, filePath);
              } else {
                buffer.buffer.open().then(() => {
                    this.loadAst(buffer, filePath);
                });
              }
            });
            // Subscribe to stop scrolling
            editorScrolling = editor.onDidChangeCursorPosition(() => {
                this.forceUpdate();
            });


            editorChanging = editor.onDidStopChanging(() => {
              //set AST -> {"seq":1,"type":"quickinfo","command":"navtree","arguments":{"file":<file-path>}}
              const filePath = editor.getPath();
              this.getTypescriptBuffer(filePath).then(buffer => {
                if(buffer.isOpen){
                  this.loadAst(buffer, filePath);
                } else {
                  buffer.buffer.open().then(() => {
                      this.loadAst(buffer, filePath);
                  });
                }
              });
            })

            panel.show();
        }

        let unsubscribeToEditor = () => {
            panel.hide();
            this.setState(null);
            if (!this.editor) return;

            editorScrolling.dispose();
            editorChanging.dispose();
            this.forceUpdate();
        }

        // We don't start unless there is work to do ... so work
        subscribeToEditor(atomUtils.getActiveEditor());

        // Tab changing
        atom.workspace.onDidChangeActivePaneItem((editor: AtomCore.IEditor) => {
            if (atomUtils.onDiskAndTs(editor) && true) {//FIXME impl. & use settings// atomConfig.showSemanticView) {
                subscribeToEditor(editor);
            }
            else {
                unsubscribeToEditor();
            }
        });
    }

    /**
     * Actually component will never unmount ... so no unsubs for now
     */
    componentWillUnmount() {
    }
    whileRendering : {lastCursorLine: number | null} = {
        lastCursorLine: 0
    }
    _render(node?: HTMLElement) {
        this.root = node? node : this.root;
        this.whileRendering = {
            lastCursorLine: this.editor && this.editor.getLastCursor() ? this.editor.getLastCursor().getBufferRow() : null
        };
        if(!this.ast){
          if(this.ast === null){
            let child = this.root.firstChild;
            if(child)
              this.root.removeChild(child);
          }
          return;////////////// EARLY EXIT /////////////////
        }
        let content = <div>
            { this.renderNode(this.ast, 0) }
            </div>;
        let child = this.root.firstChild;
        if(child)
          this.root.replaceChild(content, child);
        else
          this.root.appendChild(content);
    }
    _nodeStartLine(node: SemanticTreeNode){
      return node.spans[0].start.line - 1;
    }
    _nodeEndLine(node: SemanticTreeNode){
      let s = node.spans;
      return s[s.length - 1].end.line - 1;
    }

    renderNode(node: SemanticTreeNode, indent: number) : HTMLElement {
        return <div className="node" onClick={ (event) => {this.gotoNode(node); event.stopPropagation();} } data-start={this._nodeStartLine(node)} data-end={this._nodeEndLine(node)}>
            {rts.indent(indent) }
            <span className={this.getIconForKind(node.kind) + ' ' + this.isSelected(node) }>{node.text}</span>
                {node.childItems? node.childItems.
                      sort((a,b) => this._nodeStartLine(a) - this._nodeStartLine(b)).//TODO should there be a different sort-order? for now: just by line-number
                      map(sn=> this.renderNode(sn, indent + 1)) : '' }
            </div>
    }

    getIconForKind(kind: string) {
        return `icon icon-${kind}`;
    }
    isSelected(node: SemanticTreeNode) {
        if (this.whileRendering.lastCursorLine == null) return '';
        else {
            if (this._nodeStartLine(node) <= this.whileRendering.lastCursorLine && this._nodeEndLine(node) >= this.whileRendering.lastCursorLine) {
                return 'selected';
            }
            return '';
        }
    }
    gotoNode(node: SemanticTreeNode) {
        var gotoLine = this._nodeStartLine(node);
        this.editor.setCursorBufferPosition([gotoLine, 0]);
    }
}

interface SemanticViewOptions {
  getTypescriptBuffer: (filePath: string) => Promise<TypescriptFileBuffer>;
}

export class SemanticView extends view.ScrollView<SemanticViewOptions> {

    public mainContent: JQuery;
    public get rootDomElement() {
        return this.mainContent[0];
    }
    private comp: MyComponent;
    private getTypescriptBuffer: (filePath: string) => Promise<TypescriptFileBuffer>;
    static content() {
        return this.div({ class: 'atomts atomts-semantic-view native-key-bindings' }, () => {
            this.div({ outlet: 'mainContent', class: 'layout vertical' });
        });
    }

    constructor(public config: SemanticViewOptions) {
        super(config);
        this.getTypescriptBuffer = config.getTypescriptBuffer;
    }

    /**
     * This function exists because the react component needs access to `panel` which needs access to `SemanticView`.
     * So we lazily create react component after panel creation
     */
    started = false
    start() {
        if (this.started) return;
        this.started = true;
        this.comp = new MyComponent({getTypescriptBuffer: this.getTypescriptBuffer});
        this.comp.componentDidMount();
        this.comp._render(this.rootDomElement);
    }
}



export var mainView: SemanticView;
var panel: AtomCore.Panel;
export function attach(getTypescriptBuffer: {getTypescriptBuffer: (filePath: string) => Promise<TypescriptFileBuffer>}): {dispose(): void, semanticView: SemanticView} {

    // Only attach once
    if (mainView) {
        return {
          dispose() {
            console.log("TODO: Detach the semantic view: ", panel)
          },
          semanticView: mainView
        };
    }

    mainView = new SemanticView(getTypescriptBuffer);
    panel = atom.workspace.addRightPanel({
      item: mainView,
      priority: 1000,
      visible: atomUtils.isActiveEditorOnDiskAndTs() && true //FIXME atomConfig.showSemanticView
    });

    if (panel.isVisible()) {
        mainView.start();
    }

    return {
      dispose() {
        console.log("TODO: Detach the semantic view: ", panel)
      },
      semanticView: mainView
    }
}

export function toggle() {
    if (panel.isVisible()) {
        //FIXME// atomConfig.showSemanticView = (false);
        panel.hide();
    } else {
        //FIXME// atomConfig.showSemanticView = (true);
        panel.show();
        mainView.start();
    }
}
