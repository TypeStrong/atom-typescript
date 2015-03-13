# Span Skip-List [![Build Status](https://travis-ci.org/atom/span-skip-list.png)](https://travis-ci.org/atom/span-skip-list)

This data structure stores arbitrary mappings between various dimensions and
allows running totals to be calculated in `O(ln(n))`, where n is the number of
table entries. Say you have a table entries like the following:

| x | y |
|---|---|
| 3 | 3 |
| 5 | 2 |
| 2 | 7 |
| 4 | 4 |

With this data structure, you can determine how many y's you have traversed when
you've traversed up to a certain number of x's. For example, when you've
traversed up to 8 in the x dimension your total in the y dimension is 5. Here's
an example of how you'd use the span skip list to answer that query:

```coffeescript
SpanSkipList = require 'span-skip-list'

# Construct with the dimensions you want to track
list = new SpanSkipList('x', 'y')

# Populate with entries. Splice takes the dimension in which to interpret the
# index as a first argument. More on that later.
entries = [
  {x: 3, y: 3}
  {x: 5, y: 2}
  {x: 2, y: 7}
  {x: 4, y: 4}
]
list.splice('x', 0, 0, entries...)
list.getElements() # => [{x: 3, y: 3} {x: 5, y: 2} {x: 2, y: 7} {x: 4, y: 4}]

# Call ::totalTo with a total in one dimension to get a total in all dimensions
# up to the element that exceeds the target value in that dimension.
list.totalTo(8, 'x') # => { x: 8, y: 5 }
list.totalTo(10, 'x') # => { x: 10, y: 12 }

# Note that you always get the total exclusive of the exceeding element. In this
# case, x = 11 returns the same total as x = 10 because including the next
# element ({x: 4, y: 4} would make x = 14, which exceeds x = 11.
list.totalTo(11, 'x') # => { x: 10, y: 12 }

# The splice occurs at the index of the first element that exceeds the given
# index in the given dimension. In this case, the splice at x = 3 replaces the
# element {x: 5, y: 2} with the given element. The ::splice method returns an
# array of removed elements, list like Array::splice.
list.splice('x', 3, 1, {x: 7, y: 1}) # => [{x: 5, y: 2}]
list.getElements() # => [{x: 3, y: 3}, {x: 7, y: 1}, {x: 2, y: 7}, {x: 4, y: 4}]

# You can splice in any tracked dimension:
list.splice('y', 4, 0, {x: 2, y: 2})
list.getElements() # => [{x: 3, y: 3}, {x: 7, y: 1}, {x: 2, y: 2}, {x: 2, y: 7}, {x: 4, y: 4}]

# You can also splice and run totals in the special 'elements' dimension, which
# counts each element as a unit. This returns the total of the first 3 elements:
list.totalTo(3, 'elements') # => {x: 12, y: 6}

# And this splices at the given element index:
list.splice('elements', 2, 1) # => [{x: 2, y: 2}]
list.getElements() # => [{x: 3, y: 3}, {x: 7, y: 1}, {x: 2, y: 7}, {x: 4, y: 4}]
```
