# Atom SpacePen Views [![Build Status](https://travis-ci.org/atom/atom-space-pen-views.svg?branch=master)](https://travis-ci.org/atom/atom-space-pen-views)

This library contains SpacePen views that used to be provided as part of Atom
Core. `TextEditorView`, `SelectListView`, and `ScrollView` exports from the
`atom` module are now deprecated will soon be removed, but can still be used in
packages by depending on this library in your `package.json`.

## TextEditorView

A text editor can now be created in Atom by inserting an `<atom-text-editor>`
tag in any location you want an editor. However, if you still want to use the
SpacePen view in order to conveniently convert packages off the deprecated
export, you can use this class.

### Example

```coffee
{View} = require 'space-pen'
{TextEditorView} = require 'atom-space-pen-views'

class MyView extends View
  @content: ->
    @div =>
      @div "Type your answer:"
      @subview 'answer', new TextEditorView(mini: true)
```

### Constructor Params

Pass an optional params object to the constructor with the following keys:

* `mini` If `true`, will construct a single-line editor for use as an input
    field.
* `placeholderText` A string of placeholder text to appear in the editor when
    empty

### Methods

#### `::getModel`

Returns the underlying `TextEditor` model instance.

## ScrollView

 Handles several core events to update scroll position:

 * `core:move-up` Scrolls the view up
 * `core:move-down` Scrolls the view down
 * `core:page-up` Scrolls the view up by the height of the page
 * `core:page-down` Scrolls the view down by the height of the page
 * `core:move-to-top` Scrolls the editor to the top
 * `core:move-to-bottom` Scroll the editor to the bottom

 Subclasses must call `super` if overriding the `initialize` method.

### Example

 ```coffee
 {ScrollView} = require 'atom-space-pen-views'

 class MyView extends ScrollView
   @content: ->
     @div()

   initialize: ->
     super
     @text('super long content that will scroll')
 ```

## SelectListView

Essential: Provides a view that renders a list of items with an editor that
filters the items. Used by many packages such as the fuzzy-finder,
command-palette, symbols-view and autocomplete.


### Example

```coffee
{SelectListView} = require 'atom-space-pen-views'

class MySelectListView extends SelectListView
 initialize: ->
   super
   @addClass('overlay from-top')
   @setItems(['Hello', 'World'])
   atom.workspaceView.append(this)
   @focusFilterEditor()

 viewForItem: (item) ->
   "<li>#{item}</li>"

 confirmed: (item) ->
   console.log("#{item} was selected")
```

## Methods

### Subclasses Must Implement

#### `::viewForItem`

Create a view for the given model item. This method must be overridden by
subclasses. Called when the item is about to appended to the list view.

* `item` The model item being rendered. This will always be one of the items
  previously passed to `::setItems`.

Returns a String of HTML, DOM element, jQuery object, or View.

#### `::confirmed`

Callback function for when an item is selected. This method must
be overridden by subclasses.

* `item` The selected model item. This will always be one of the items
  previously passed to `::setItems`.

Returns a DOM element, jQuery object, or {View}.

### Managing the list of items

#### `::setItems`

Set the array of items to display in the list. This should be
model items, not actual views. `::viewForItem` will be called to render the
item when it is being appended to the list view.

* `items` The array of model items to display in the list (default: []).

#### `::getSelectedItem`

Get the model item that is currently selected in the list view.

#### `::getFilterKey`

Get the property name to use when filtering items.

This method may be overridden by classes to allow fuzzy filtering based
on a specific property of the item objects.

For example if the objects you pass to {::setItems} are of the type
`{"id": 3, "name": "Atom"}` then you would return `"name"` from this method
to fuzzy filter by that property when text is entered into this view's
editor.


#### `::getFilterQuery`

Get the filter query to use when fuzzy filtering the visible elements.

By default this method returns the text in the mini editor but it can be
overridden by subclasses if needed.

Returns a {String} to use when fuzzy filtering the elements to display.


#### `::setMaxItems`

Set the maximum numbers of items to display in the list.

* `maxItems` The maximum {Number} of items to display.

#### `::populateList`

Extended: Populate the list view with the model items previously set by calling
{::setItems}.

Subclasses may override this method but should always call `super`.

### Messages

#### `::setError`

Set the error message to display.

* `message` A string with an error message (default: '').

#### `::setLoading`

Set the loading message to display.

* `message` A string with a loading message (default: '').

#### `::getEmptyMessage`

Get the message to display when there are no items.

Subclasses may override this method to customize the message.

* `itemCount` The {Number} of items in the array specified to {::setItems}
* `filteredItemCount` The {Number} of items that pass the fuzzy filter test.

Returns a {String} message (default: 'No matches found').

### View Actions

#### `::cancel`

Cancel and close this select list view.

This restores focus to the previously focused element if `::storeFocusedElement`
was called prior to this view being attached.

#### `::focusFilterEditor`

Focus the fuzzy filter editor view.

#### `::storeFocusedElement`

Store the currently focused element. This element will be given back focus when
`::cancel` is called.
