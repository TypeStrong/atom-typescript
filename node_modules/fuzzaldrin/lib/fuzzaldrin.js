(function() {
  var PathSeparator, SpaceRegex, filter, matcher, scorer;

  scorer = require('./scorer');

  filter = require('./filter');

  matcher = require('./matcher');

  PathSeparator = require('path').sep;

  SpaceRegex = /\ /g;

  module.exports = {
    filter: function(candidates, query, options) {
      var queryHasSlashes;
      if (query) {
        queryHasSlashes = query.indexOf(PathSeparator) !== -1;
        query = query.replace(SpaceRegex, '');
      }
      return filter(candidates, query, queryHasSlashes, options);
    },
    score: function(string, query) {
      var queryHasSlashes, score;
      if (!string) {
        return 0;
      }
      if (!query) {
        return 0;
      }
      if (string === query) {
        return 2;
      }
      queryHasSlashes = query.indexOf(PathSeparator) !== -1;
      query = query.replace(SpaceRegex, '');
      score = scorer.score(string, query);
      if (!queryHasSlashes) {
        score = scorer.basenameScore(string, query, score);
      }
      return score;
    },
    match: function(string, query) {
      var baseMatches, index, matches, queryHasSlashes, seen, _i, _ref, _results;
      if (!string) {
        return [];
      }
      if (!query) {
        return [];
      }
      if (string === query) {
        return (function() {
          _results = [];
          for (var _i = 0, _ref = string.length; 0 <= _ref ? _i < _ref : _i > _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this);
      }
      queryHasSlashes = query.indexOf(PathSeparator) !== -1;
      query = query.replace(SpaceRegex, '');
      matches = matcher.match(string, query);
      if (!queryHasSlashes) {
        baseMatches = matcher.basenameMatch(string, query);
        matches = matches.concat(baseMatches).sort(function(a, b) {
          return a - b;
        });
        seen = null;
        index = 0;
        while (index < matches.length) {
          if (index && seen === matches[index]) {
            matches.splice(index, 1);
          } else {
            seen = matches[index];
            index++;
          }
        }
      }
      return matches;
    }
  };

}).call(this);
