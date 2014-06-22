'use strict';
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ServiceConsumer = require('./serviceConsumer');
var completion = require('../commons/completion');
var CompletionKind = completion.CompletionKind;

var HINT_TEMPLATE = [
    '<span class="cm-s-default">',
    '   <span style="display: inline-block" class="{{classType}}">',
    '       <span style="font-weight: bold">{{match}}</span>{{suffix}}',
    '   </span>',
    '</span>'
].join('\n');

var CodeHintProvider = (function (_super) {
    __extends(CodeHintProvider, _super);
    function CodeHintProvider() {
        _super.apply(this, arguments);
    }
    CodeHintProvider.prototype.hasHints = function (editor, implicitChar) {
        if (!implicitChar || /[\w.\($_]/.test(implicitChar)) {
            this.editor = editor;
            return true;
        }
        return false;
    };

    CodeHintProvider.prototype.getHints = function (implicitChar) {
        var currentFileName = this.editor.document.file.fullPath, position = this.editor.getCursorPos(), deferred = $.Deferred();
        if (!this.hasHints(this.editor, implicitChar)) {
            deferred.resolve({
                hints: [],
                selectInitial: false
            });
        } else {
            this.getService().then(function (service) {
                service.getCompletionAtPosition(currentFileName, position).then(function (result) {
                    deferred.resolve({
                        hints: result.entries.map(function (entry) {
                            var text = entry.name, match, suffix, classType = '';

                            switch (entry.kind) {
                                case 7 /* KEYWORD */:
                                    switch (entry.name) {
                                        case 'static':
                                        case 'public':
                                        case 'private':
                                        case 'export':
                                        case 'get':
                                        case 'set':
                                            classType = 'cm-qualifier';
                                            break;
                                        case 'class':
                                        case 'function':
                                        case 'module':
                                        case 'var':
                                            classType = 'cm-def';
                                            break;
                                        default:
                                            classType = 'cm-keyword';
                                            break;
                                    }
                                    break;
                                case 5 /* METHOD */:
                                case 6 /* FUNCTION */:
                                    text += entry.type ? entry.type : '';
                                    break;
                                default:
                                    text += entry.type ? ' - ' + entry.type : '';
                                    break;
                            }

                            if (result.match) {
                                match = text.slice(0, result.match.length);
                                suffix = text.slice(result.match.length);
                            } else {
                                match = '';
                                suffix = text;
                            }

                            var jqueryObj = $(Mustache.render(HINT_TEMPLATE, {
                                match: match,
                                suffix: suffix,
                                classType: classType
                            }));
                            jqueryObj.data('entry', entry);
                            jqueryObj.data('match', result.match);
                            return jqueryObj;
                        }),
                        selectInitial: !!implicitChar
                    });
                }).catch(function (error) {
                    return deferred.reject(error);
                });
            });
        }
        return deferred;
    };

    CodeHintProvider.prototype.insertHint = function ($hintObj) {
        var entry = $hintObj.data('entry'), match = $hintObj.data('match'), position = this.editor.getCursorPos(), startPos = !match ? position : {
            line: position.line,
            ch: position.ch - match.length
        };

        this.editor.document.replaceRange(entry.name, startPos, position);
    };
    return CodeHintProvider;
})(ServiceConsumer);

module.exports = CodeHintProvider;
