{$$$, View, TextEditorView} = require 'atom-space-pen-views'

module.exports =
    ->
        @div tabIndex: -1, class: 'atomts-rename-view', =>
            @div class: 'block', =>
                @div =>
                    @span {outlet: 'title'}, => 'Rename Variable'
                    @span class: 'subtle-info-message', =>
                        @span 'Close this panel with '
                        @span class:'highlight', 'esc'
                        @span ' key. And commit with the '
                        @span class:'highlight', 'enter'
                        @span 'key.'

            @div class: 'find-container block', =>
                @div class: 'editor-container', =>
                    @subview 'newNameEditor', new TextEditorView(mini: true, placeholderText: 'new name')

            @div {outlet:'fileCount'}, => return
            @br {}
            @div {class: 'highlight-error', style:'display:none', outlet:'validationMessage'},
