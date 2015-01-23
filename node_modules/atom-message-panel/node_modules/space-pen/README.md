# SpacePen [![Build Status](https://travis-ci.org/atom/space-pen.svg?branch=master)](https://travis-ci.org/atom/space-pen)

**Version 4.x of SpacePen is intended to be included as a direct dependency of 1.0-compatible Atom packages. If you're looking for SpacePen 3.x, used in [Atom Core](https://github.com/atom/atom), check out the [3.x branch](https://github.com/atom/space-pen/tree/3.x).**

## Write markup on the final frontier

SpacePen is a powerful but minimalistic client-side view framework for
CoffeeScript. It combines the "view" and "controller" into a single jQuery
object, whose markup is expressed with an embedded DSL similar to Markaby for
Ruby.

## Changes In Version 4

This version of SpacePen depends on HTML 5 custom elements to support lifecycle
hooks that previously depended on all DOM manipulation being performed via
jQuery. The `afterAttach` and `beforeRemove` hooks have been replaced with
`attached` and `detached` and their semantics have been altered.

If you need to use SpacePen in an environment that doesn't support custom
elements, consider using the previous major version or switching frameworks.

## Basics

View objects extend from the View class and have a @content class method where
you express their HTML contents with an embedded markup DSL:

```coffeescript
class Spacecraft extends View
  @content: ->
    @div =>
      @h1 "Spacecraft"
      @ol =>
        @li "Apollo"
        @li "Soyuz"
        @li "Space Shuttle"
```

Views descend from jQuery's prototype, so when you construct one you can call
jQuery methods on it just as you would a DOM fragment created with `$(...)`.

```coffeescript
view = new Spacecraft
view.find('ol').append('<li>Star Destroyer</li>')

view.on 'click', 'li', ->
  alert "They clicked on #{$(this).text()}"
```

But SpacePen views are more powerful than normal jQuery fragments because they
let you define custom methods:

```coffeescript
class Spacecraft extends View
  @content: -> ...

  addSpacecraft: (name) ->
    @find('ol').append "<li>#{name}</li>"


view = new Spacecraft
view.addSpacecraft "Enterprise"
```

You can also pass arguments on construction, which get passed to both the
`@content` method and the view's constructor.

```coffeescript
class Spacecraft extends View
  @content: (params) ->
    @div =>
      @h1 params.title
      @ol =>
        @li name for name in params.spacecraft

view = new Spacecraft(title: "Space Weapons", spacecraft: ["TIE Fighter", "Death Star", "Warbird"])
```

Methods from the jQuery prototype can be gracefully overridden using `super`:

```coffeescript
class Spacecraft extends View
  @content: -> ...

  hide: ->
    console.log "Hiding Spacecraft List"
    super()
```

If you override the View class's constructor, ensure you call `super`.
Alternatively, you can define an `initialize` method, which the constructor will
call for you automatically with the constructor's arguments.

```coffeescript
class Spacecraft extends View
  @content: -> ...

  initialize: (params) ->
    @title = params.title
```

## Outlets and Events

SpacePen will automatically create named reference for any element with an
`outlet` attribute. For example, if the `ol` element has an attribute
`outlet=list`, the view object will have a `list` entry pointing to a jQuery
wrapper for the `ol` element.

```coffeescript
class Spacecraft extends View
  @content: ->
    @div =>
      @h1 "Spacecraft"
      @ol outlet: "list", =>
        @li "Apollo"
        @li "Soyuz"
        @li "Space Shuttle"

  addSpacecraft: (name) ->
    @list.append("<li>#{name}</li>")
```

Elements can also have event name attributes whose value references a custom
method. For example, if a `button` element has an attribute
`click=launchSpacecraft`, then SpacePen will invoke the `launchSpacecraft`
method on the button's parent view when it is clicked:

```coffeescript
class Spacecraft extends View
  @content: ->
    @div =>
      @h1 "Spacecraft"
      @ol =>
        @li click: 'launchSpacecraft', "Saturn V"

  launchSpacecraft: (event, element) ->
    console.log "Preparing #{element.name} for launch!"
```
## Markup DSL Details

### Tag Methods (`@div`, `@h1`, etc.)

As you've seen so far, the markup DSL is pretty straightforward. From the
`@content` class method or any method it calls, just invoke instance methods
named for the HTML tags you want to generate. There are 3 types of arguments you
can pass to a tag method:

* *Strings*: The string will be HTML-escaped and used as the text contents of the generated tag.

* *Hashes*: The key-value pairs will be used as the attributes of the generated tag.

* *Functions* (bound with `=>`): The function will be invoked in-between the open and closing tag to produce the HTML element's contents.

If you need to emit a non-standard tag, you can use the `@tag(name, args...)`
method to name the tag with a string:

```coffeescript
@tag 'bubble', type: "speech", => ...
```

### Text Methods

* `@text(string)`: Emits the HTML-escaped string as text wherever it is called.

* `@raw(string)`: Passes the given string through unescaped. Use this when you need to emit markup directly that was generated beforehand.

## Subviews

Subviews are a great way to make your view code more modular. The
`@subview(name, view)` method takes a name and another view object. The view
object will be inserted at the location of the call, and a reference with the
given name will be wired to it from the parent view. A `parentView` reference
will be created on the subview pointing at the parent.

```coffeescript
class Spacecraft extends View
  @content: (params) ->
    @div =>
      @subview 'launchController', new LaunchController(countdown: params.countdown)
      @h1 "Spacecraft"
      ...
```

## Freeform Markup Generation

You don't need a View class to use the SpacePen markup DSL. Call `View.render`
with an unbound function (`->`, not `=>`) that calls tag methods, and it will
return a document fragment for ad-hoc use. This method is also assigned to the
`$$` global variable for convenience.

```coffeescript
view.list.append $$ ->
  @li =>
    @text "Starship"
    @em "Enterprise"
```

## jQuery extensions

### $.fn.view
You can retrieve the view object for any DOM element by calling `view()` on it.
This usually shouldn't be necessary, as most DOM manipulation will take place
within the view itself using outlet references, but is occasionally helpful.

```coffeescript
view = new Spacecraft
$('body').append(view)

# assuming no other li elements on the DOM, for example purposes,
# the following expression should be true
$('li').view() == view
```

### Attached/Detached Hooks
The `initialize` method is always called when the view is still a detached DOM
fragment, before it is appended to the DOM. This is usually okay, but
occasionally you'll have some initialization logic that depends on the view
actually being on the DOM. For example, you may depend on applying a CSS rule
before measuring an element's height.

For these situations, use the `attached` hook. It will be called whenever your
element is actually attached to the DOM. Past versions of SpacePen would also
call this hook when your element was attached to another detached node, but that
behavior is no longer supported.

To be notified when your element is detached from the DOM, implement the
`detached` hook.

```coffeescript
class Spacecraft extends View
  @content: -> ...

  attached: ->
    console.log "With CSS applied, my height is", @height()

  detached: ->
    console.log "I have been detached."
```

## Hacking on SpacePen

```sh
git clone https://github.com/atom/space-pen.git
cd space-pen
npm install
npm start
```

* Open http://localhost:1337 to run the specs
* Open http://localhost:1337/benchmark to run the benchmarks
* Open http://localhost:1337/examples to browse the examples
