# delegato [![Build Status](https://travis-ci.org/atom/delegato.png?branch=master)](https://travis-ci.org/atom/delegato)

## Delegate Methods

```coffee
Delegato = require 'delegato'

class Ship
  Delegato.includeInto(this)
  
  @delegatesMethods 'dropAnchor', 'raiseAnchor', toProperty: 'winch'
  @delegatesMethod 'leavePort', toMethod: 'getCaptain'
```

## Delegate Properties

```coffee
class MyClass
  Delegato.includeInto(this)
  
  @delegatesProperty 'steamPressure', toProperty: 'engineRoom'
  @delegatesProperties 'heading', 'speed', toMethod: 'getVelocity'
```
