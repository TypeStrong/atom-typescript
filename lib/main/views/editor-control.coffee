path = require 'path'
{BufferedProcess} = require 'atom'
{Subscriber} = require 'emissary'
{TooltipView} = require './tooltip-view'
{isFlowSource, pixelPositionFromMouseEvent, screenPositionFromMouseEvent} = require './utils'

class EditorControl
  constructor: (@editorView, @manager) ->
    @checkMarkers = []

    @editor = @editorView.getEditor()
    @gutter = @editorView.gutter
    @scroll = @editorView.find('.scroll-view')

    @subscriber = new Subscriber()

    # event for editor updates
    @subscriber.subscribe @editorView, 'editor:will-be-removed', =>
      @deactivate()

    # buffer events for automatic check
    @subscriber.subscribe @editor.getBuffer(), 'saved', (buffer) =>
      return unless isFlowSource @editor

      # TODO if uri was changed, then we have to remove all current markers

      if atom.config.get('ide-flow.checkOnFileSave')
        atom.workspaceView.trigger 'ide-flow:check'

    # show expression type if mouse stopped somewhere
    @subscriber.subscribe @scroll, 'mousemove', (e) =>
      @clearExprTypeTimeout()
      @exprTypeTimeout = setTimeout (=>
        @showExpressionType e
      ), 100
    @subscriber.subscribe @scroll, 'mouseout', (e) =>
      @clearExprTypeTimeout()

    # mouse movement over gutter to show check results
    @subscriber.subscribe @gutter, 'mouseenter', ".ide-flow-error", (e) =>
      @showCheckResult e
    @subscriber.subscribe @gutter, 'mouseleave', ".ide-flow-error", (e) =>
      @hideCheckResult()
    @subscriber.subscribe @gutter, 'mouseleave', (e) =>
      @hideCheckResult()

    atom.workspaceView.trigger 'ide-flow:check'

    # update all results from manager
    @resultsUpdated()

  deactivate: ->
    @clearExprTypeTimeout()
    #@hideCheckResult()
    @subscriber.unsubscribe()
    @editorView.control = undefined

  # helper function to hide tooltip and stop timeout
  clearExprTypeTimeout: ->
    if @exprTypeTimeout?
      clearTimeout @exprTypeTimeout
      @exprTypeTimeout = null
    @hideExpressionType()

  # get expression type under mouse cursor and show it
  showExpressionType: (e) ->
    return unless isFlowSource(@editor) and not @exprTypeTooltip?

    pixelPt = pixelPositionFromMouseEvent(@editorView, e)
    screenPt = @editor.screenPositionForPixelPosition(pixelPt)
    bufferPt = @editor.bufferPositionForScreenPosition(screenPt)
    curCharPixelPt = @editor.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column])
    nextCharPixelPt = @editor.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column + 1])

    return if curCharPixelPt.left >= nextCharPixelPt.left

    # find out show position
    offset = @editorView.lineHeight * 0.7
    tooltipRect =
      left: e.clientX
      right: e.clientX
      top: e.clientY - offset
      bottom: e.clientY + offset

    # create tooltip with pending
    @exprTypeTooltip = new TooltipView(tooltipRect)

    @manager.typeAtPos
      bufferPt: bufferPt
      fileName: @editor.getPath()
      text: @editor.getText()
      onResult: (result) =>
        @exprTypeTooltip?.updateText(result.type)

  hideExpressionType: ->
    if @exprTypeTooltip?
      @exprTypeTooltip.remove()
      @exprTypeTooltip = null

  resultsUpdated: ->
    @destroyMarkers()
    @markerFromCheckResult(err) for err in @manager.checkResults
    @renderResults()

  destroyMarkers: ->
    m.marker.destroy() for m in @checkMarkers
    @checkMarkers = []

  markerFromCheckResult: (err) ->
    return unless err.path is @editor.getPath()
    marker = @editor.markBufferRange [[err.line-1, err.start-1],[err.endline-1, err.end]], invalidate: 'never'
    @checkMarkers.push({ marker, desc: err.descr })

  renderResults: ->
    @decorateMarker(m) for m in @checkMarkers

  decorateMarker: ({marker}) ->
    @editor.decorateMarker marker, type: 'gutter', class: 'ide-flow-error'
    @editor.decorateMarker marker, type: 'highlight', class: 'ide-flow-error'
    @editor.decorateMarker marker, type: 'line', class: 'ide-flow-error'

    # show check result when mouse over gutter icon
  showCheckResult: (e) ->
    @hideCheckResult()
    row = @editor.bufferPositionForScreenPosition(screenPositionFromMouseEvent(@editorView, e)).row

    # find best result for row
    foundResult = null
    for {marker, desc} in @checkMarkers
      if marker.getHeadBufferPosition().row is row
        foundResult = desc
        break

    # append tooltip if result found
    return unless foundResult?

    # create show position
    targetRect = e.currentTarget.getBoundingClientRect()
    offset = @editorView.lineHeight * 0.3
    rect =
      left: targetRect.left - offset
      right: targetRect.right + offset
      top: targetRect.top - offset
      bottom: targetRect.bottom + offset

    @checkResultTooltip = new TooltipView(rect, foundResult)

  hideCheckResult: ->
    if @checkResultTooltip?
      @checkResultTooltip.remove()
      @checkResultTooltip = null

module.exports = { EditorControl }
