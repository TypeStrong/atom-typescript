// This file is only called from linter
// See : https://github.com/AtomLinter/Linter/issues/337

///ts:import=utils
import utils = require('./main/lang/utils'); ///ts:import:generated
///ts:import=parent
import parent = require('./worker/parent'); ///ts:import:generated

import fs = require('fs');
import {Range} from "atom";

interface LinterMessage {
    type: string, // "Error" or "Warning"
    text?: string,
    html?: string,
    filePath?: string,
    range?: TextBuffer.IRange,
    //  trace?: Array<Trace> // We don't care about this so I have this commented out
}

export var provider = {
    name: 'TS',
    grammarScopes: ['source.ts', 'source.tsx'],
    scope: 'file', //  # or 'project'
    lintOnFly: true, // # must be false for scope: 'project'
    lint: (textEditor: AtomCore.IEditor): Promise<LinterMessage[]> => {

        // We do not support files not on disk
        if (!textEditor.buffer.file
            || !textEditor.buffer.file.path
            || !fs.existsSync(textEditor.buffer.file.path)) return Promise.resolve([]);

        var filePath = textEditor.buffer.file.path;

        // Trigger an error check
        parent.client.executeGetErr({files: [filePath], delay: 100})

        return new Promise((resolve, reject) => {

          // Listen for a semanticDiag message for this specific file, unsub and resolve
          const unsub = parent.client.on("semanticDiag", result => {
            if (result.file === filePath) {
              try {
                unsub()

                const errors: LinterMessage[] = result.diagnostics.map(diag => {
                  return {
                    type: "Error",
                    filePath,
                    text: diag.text,
                    range: new Range(
                      [diag.start.line-1, diag.start.offset-1],
                      [diag.end.line-1, diag.end.offset-1])
                  }
                })

                resolve(errors)
              } catch (error) {
                resolve([])
              }
            }
          })
        })
    }
}
