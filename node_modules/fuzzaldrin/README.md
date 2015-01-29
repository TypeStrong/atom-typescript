# fuzzaldrin

[![Build Status](https://travis-ci.org/atom/fuzzaldrin.svg?branch=master)](https://travis-ci.org/atom/fuzzaldrin)
[![Build status](https://ci.appveyor.com/api/projects/status/0ig71rjdgfm7y9c1/branch/master)](https://ci.appveyor.com/project/kevinsawicki/fuzzaldrin/branch/master)

Fuzzy filtering and string scoring.

This library is used by [Atom](http://atom.io) and so its focus will be on
scoring and filtering paths, methods, and other things common when writing code.
It therefore will specialize in handling common patterns in these types of
strings such as characters like `/`, `-`, and `_`, and also handling of
camel cased text.

## Using

```sh
npm install fuzzaldrin
```

### filter(candidates, query, [options])

Sort and filter the given candidates by matching them against the given query.

* `candidates` - An array of strings or objects.
* `query` - A string query to match each candidate against.
* `options` - An optional object with the following keys:
  * `key` - The property to use for scoring if the candidates are objects.
  * `maxResults` - The maximum numbers of results to return.

Returns an array of candidates sorted by best match against the query.

```coffee
{filter} = require 'fuzzaldrin'

# With an array of strings
candidates = ['Call', 'Me', 'Maybe']
results = filter(candidates, 'me')
console.log(results) # ['Me', 'Maybe']

# With an array of objects
candidates = [
  {name: 'Call', id: 1}
  {name: 'Me', id: 2}
  {name: 'Maybe', id: 3}
]
results = filter(candidates, 'me', key: 'name')
console.log(results) # [{name: 'Me', id: 2}, {name: 'Maybe', id: 3}]
```

### score(string, query)

Score the given string against the given query.

* `string` - The string the score.
* `query` - The query to score the string against.

```coffee
{score} = require 'fuzzaldrin'

score('Me', 'me')    # 0.17099999999999999
score('Maybe', 'me') # 0.0693
```

## Developing

```sh
git clone https://github.com/atom/fuzzaldrin.git
cd fuzzaldrin
npm install
npm test
```

You can run the benchmarks using:

```sh
npm run benchmark
```
