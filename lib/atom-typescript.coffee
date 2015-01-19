# This file is only called from linter
# See : https://github.com/AtomLinter/Linter/issues/337
# This is what happens when packages use convention over configuration :P

linterPath = atom.packages.getLoadedPackage("linter").path
Linter = require "#{linterPath}/lib/linter"
path = require "path"
{Range} = require "atom"

class LinterTslint extends Linter
  # The syntax that the linter handles. May be a string or
  # list/tuple of strings. Names should be all lowercase.
  @syntax: ['source.ts']

  lintFile: (filePath, callback) ->
    filePath = @editor.buffer.file.path;
    contents = @editor.getText();
    fileName = path.basename(filePath);

    # TODO: fetch errors from singleton language service
    callback [{
            message: 'a very bad failure sample in file : ' + fileName,
            line: 0,
            range: new Range(
                [0,0],[0,5]
            ),
            linter: 'TypeScript'
            level: 'error'
        }]
    # console.log(filePath, contents);

    # messages = messagesUnprocessed.map (message) =>
    #   message: message.failure,
    #   line: message.startPosition.line + 1,
    #   range: new Range(
    #     [message.startPosition.line, message.startPosition.character == 0 ? 0 : message.startPosition.character - 1],
    #     [message.endPosition.line, message.endPosition.character]),
    #   linter: @linterName,
    #   level: 'error'
    #
    # callback messages


module.exports = LinterTslint
