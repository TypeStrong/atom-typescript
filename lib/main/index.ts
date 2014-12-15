///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import path = require('path');
import tsproj = require('tsproj');

// globals 
var statusBar;
var statusBarMessage;
var editorWatch: AtomCore.Disposable;

export interface PackageState {
}

export function activate(state: PackageState) {

    atom.packages.once('activated', () => {

        statusBar = document.querySelector("status-bar");
        if (statusBar) {
            // statusBarMessage = statusBar.addLeftTile({ item: something, priority: 100 });
        }


        editorWatch = atom.workspace.observeTextEditors((editor) => {
            var filePath = editor.getPath();
            var filename = path.basename(filePath);
            var ext = path.extname(filename);

            if (ext == '.ts') {
                // console.log('TypeScript file opened:', filename)
                try {
                    var proj = tsproj.getProjectsForFileSync(filePath);
                    // console.log('Project detected:', proj);
                    // TODO: display selected project on status bar
                }
                catch (ex) {
                    // So we don't have a project, create it:
                    if (ex.message == 'No Project Found') {
                        tsproj.createProjectsRootSync(filePath);
                    }
                    // console.error('tsproj not loaded:',ex.message);
                }
            }
        });

    });
}

export function deactivate() {
    if (statusBarMessage) statusBarMessage.destroy();
    editorWatch.dispose();
}

export function serialize(): PackageState {
    return {};
}

export function deserialize() {
    /* do any tear down here */
}
