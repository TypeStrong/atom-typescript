# The Atom Message Panel

[![Gitter chat](https://badges.gitter.im/tcarlsen/atom-message-panel.png)](https://gitter.im/tcarlsen/atom-message-panel)

> The easy way to display your messages in [Atom](http://atom.io).

![preview](https://cloud.githubusercontent.com/assets/145288/2628677/25f9ba7a-be2b-11e3-9780-8172cf7ea292.png)

## Why!?

To streamline how plugin messages are displayed in Atom! :fist:

[Checkout this list of packages already using Atom Message Panel.](https://github.com/tcarlsen/atom-message-panel/wiki/They-use-it!)

## Usage

**JavaScript:**

```javascript
var MessagePanelView = require('atom-message-panel').MessagePanelView,
    PlainMessageView = require('atom-message-panel').PlainMessageView;

var messages = new MessagePanelView({
  title: 'It\'s alive..... IT\'S ALIIIIIVE!!!!'
});

messages.attach();

messages.add(new PlainMessageView({
  message: 'I did it mommy, I made my first Atom Message Panel!',
  className: 'text-success'
}));
```

**CoffeeScript:**

```coffeescript
{MessagePanelView, LineMessageView} = require 'atom-message-panel'

messages = new MessagePanelView
    title: 'Remember your Coffee!'

messages.attach()

messages.add new LineMessageView
    line: 1
    character: 4
    message: 'You haven\'t had a single drop of coffee since this character'
```

## API

**MessagePanelView:**

*It all depends on this guy, this is your init function and you will need it :sunglasses:*

 * `new MessagePanelView(params)`:
  - `title`: the title of your panel
  - `rawTitle`: sat to `true` will allow the title to contains HTML *(default is false)*
  - `closeMethod`: What should the close button do? `detach` *(default)* or `hide`.
  - `speed`: how fast you what the fold/unfold function to run *(default is fast)*
  - `recentMessagesAtTop`: should new messages be added at the top? *(default is false)*
  - `position`: should the panel attach to the "top" or the "bottom" *(default is bottom)*
  - `maxHeight`: set a max-height of the panel body *(default is 170px)*
 * `attach()`: append the panel to the Atom view
 * `close()`: closes the panel
 * `setTitle(title:string,raw?:boolean)`: change the panel title
 * `toggle()`: fold/unfold the panel
 * `clear()`: clear the body
 * `add()`: add a view to the panel

**PlainMessageView:**

*Lets you add a simple message :speech_balloon:*

 * `PlainMessageView(params)`:
  - `message`: your message to the people
  - `raw`: sat to `true` will allow the mesage to contains HTML *(default is false)*
  - `className`: adding css classes to your message *(this is optional)*

**LineMessageView:**

*Lets you add messages for a specific line and character, and it will even navigate the user to that position with a single click :boom:*

  * `LineMessageView(params)`:
   - `message`: your message to the people
   - `line`: what line are we talking about?
   - `file`: so, was that in some other file? *(this is optional)*
   - `character`: lets be more specific of what we are talking about *(this is optional)*
   - `preview`: lets you display a code snippet inside a `pre` tag *(this is optional)*
   - `className`: adding css classes to your message *(this is optional)*

## License

[MIT](LICENSE.md) © tcarlsen
