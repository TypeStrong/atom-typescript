# Interval Skip List [![Build Status](https://travis-ci.org/atom/interval-skip-list.png)](https://travis-ci.org/atom/interval-skip-list)

This data structure maps intervals to values and allows you to find all
intervals that contain an index in `O(ln(n))`, where `n` is the number of
intervals stored. This implementation is based on the paper
[The Interval Skip List](https://www.cise.ufl.edu/tr/DOC/REP-1992-45.pdf) by
Eric N. Hanson.

## Basic Usage Example

```coffee
IntervalSkipList = require 'interval-skip-list'
list = new IntervalSkipList

list.insert('a', 2, 7)
list.insert('b', 1, 5)
list.insert('c', 8, 8)

list.findContaining(1) # => ['b']
list.findContaining(2) # => ['b', 'a']
list.findContaining(8) # => ['c']

list.remove('b')

list.findContaining(2) # => ['a']
```

## API

* `::insert(label, startIndex, endIndex)`
  Adds an interval with the given unique label to the list.

* `::remove(label)`
  Removes the interval with the given unique label from the list.

* `::update(label, startIndex, endIndex)`
  Inserts or updates the interval corresponding to the given unique label.
  Unlike `::insert`, this method allows you to specify a label that's already
  been inserted in the list.

* `::findContaining(indices...)`
  Returns the labels of all intervals containing the given indices.

* `::findIntersecting(indices...)`
  Returns the labels of all intervals intersecting the given set of indices.
  Unlike `::findContaining`, this method does not require that the intervals
  contain *all* the given indices.

* `::findStartingAt(index)`
  Returns the labels of all intervals starting at the given index.

* `::findEndingAt(index)`
  Returns the labels of all intervals ending at the given index.

* `::findStartingIn(startIndex, endIndex)`
  Returns the labels of all intervals starting within the interval described by
  the given start and end indices.

* `::findEndingIn(startIndex, endIndex)`
  Returns the labels of all intervals ending within the interval described by
  the given start and end indices.

## Using a Custom Comparator

You can also supply a custom comparator function with corresponding min and max
index values. The following example uses arrays expressing coordinate pairs
instead of the default numeric values:

```coffee
list = new IntervalSkipList
  minIndex: [-Infinity, -Infinity]
  maxIndex: [Infinity, Infinity]
  compare: (a, b) ->
    if a[0] < b[0]
      -1
    else if a[0] > b[0]
      1
    else
      if a[1] < b[1]
        -1
      else if a[1] > b[1]
        1
      else
        0

  list.insert("a", [1, 2], [3, 4])
  list.insert("b", [2, 1], [3, 10])
  list.findContaining([1, Infinity]) # => ["a"]
  list.findContaining([2, 20]) # => ["a", "b"]
```
