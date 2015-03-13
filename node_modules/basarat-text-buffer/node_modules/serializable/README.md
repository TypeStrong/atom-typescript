# Serializable

This npm provides a `Serializable` mixin to streamline the process of writing
serializable classes. Include the mixin and implement two instance methods
(`::serializeParams` and `::deserializeParams`) to add serialization to your
class.

## Using Serializable Classes

### Basics

Before digging into how to implement serializable classes, let's touch on how
to use them. To serialize an object, call `::serialize`. To deserialize an
object, call `.deserialize` on its class with the results of a previous call to
`::serialize`.

```coffee
train1 = new Train(cars: 20, hasCaboose: true)
train1State = train1.serialize()
train2 = Train.deserialize(train1State)
expect(train2.cars).toBe 20
expect(train2.hasCaboose).toBe true
```

### Extra Deserialize Params

You can pass `.deserialize` an optional second argument containing additional
non-serializable parameters which will be merged with the deserialized
parameters when constructing the object. For example, say that trains need a
reference to a `RailNetwork` instance, but that the `RailNetwork` isn't
serialized as part of `Train`:

```coffee
train1 = new Train(cars: 20, hasCaboose: true, railNetwork: network)
train1State = train1.serialize() # does not contain a serialized RailNetwork
train2 = Train.deserialize(train1State, railNetwork: network)
```

## Implementing Serializable Classes

### Including the Mixin

The `Serializable` mixin is implemented with the [mixto](https://github.com/atom/mixto)
npm. To include it, use the `.includeInto` class method or simply subclass
`Serializable`.

```coffee
Serializable = require 'serializable'

class Automobile extends Vehicle
  Serializable.includeInto(this)
```

### ::serializeParams()

This method should return a plain JavaScript object containing the serialized
version of all parameters required to reconstruct the object.

```coffee
class Automobile extends Vehicle
  Serializable.includeInto(this)
  
  constructor: (@doors=4, @engine='v8') ->
  
  serializeParams: -> {@doors, @engine}
```

If all your parameters are scalars, this is all that's required. When
deserializing, Serializable will match up the names of the keys in the params hash
with the names of your constructor parameters to reconstruct your object.

```coffee
auto1 = new Automobile(2, 'v6')
auto2 = Automobile.deserialize(auto1.serialize())
expect(auto2.doors).toBe 2
expect(auto2.engine).toBe 'v6'
```

You can also take a params hash as your constructor argument, in which case
Serializable won't attempt to match up constructor parameter names.

```coffee
class Train extends Vehicle
  Serializable.includeInto(this)

  constructor: ({@cars, @hasCaboose}={}) ->

  serializeParams: -> {@cars, @hasCaboose}
```

### ::deserializeParams(params)

If your params hash contains nested serialized objects, you'll need to
deserialize the nested objects before they are passed to the constructor of the
parent object. You perform this deserialization in the optional
`::deserializeParams` instance method.

```coffee
class Plane extends Vehicle
  constructor: (@engines, @pilot) ->
    @pilot ?= new Pilot(name: "Bob", plane: this)
  
  serializeParams: -> {@engines, pilot: @pilot.serialize()}
  
  deserializeParams: (params) ->
    params.pilot = Pilot.deserialize(params.pilot, plane: this)
    params
```

Using some JS trickery, this method is called *before* your object's
constructor, allowing you to reference the instance being deserialized when
deserializing its children. You can also perform pre-initialization in this
method. Note that it is safe to modify the params object that is passed
into your method. This is convenient when only a subset of your params need to
be deserialized.

## Polymorphic Deserialization

If you can't know the specific class of the object you are deserializing ahead
of time, you can call `::registerDeserializers` on a superclass (or any
serializable class) to enable polymorphic deserialization.

```coffee
Vehicle.registerDeserializers(Plane, Train)
Vehicle.registerDeserializer(Automobile)

vehicleStates = [plane, train, auto].map (vehicle) -> vehicle.serialize()
vehicles = vehicleStates.map (vehicleState) -> Vehicle.deserialize(vehicleState)
```
