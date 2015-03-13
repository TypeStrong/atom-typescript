(function() {
  var SpliceArrayChunkSize,
    __slice = [].slice;

  SpliceArrayChunkSize = 100000;

  module.exports = {
    spliceArray: function(originalArray, start, length, insertedArray) {
      var chunk, chunkEnd, chunkStart, removedValues, _i, _ref;
      if (insertedArray == null) {
        insertedArray = [];
      }
      if (insertedArray.length < SpliceArrayChunkSize) {
        return originalArray.splice.apply(originalArray, [start, length].concat(__slice.call(insertedArray)));
      } else {
        removedValues = originalArray.splice(start, length);
        for (chunkStart = _i = 0, _ref = insertedArray.length; SpliceArrayChunkSize > 0 ? _i <= _ref : _i >= _ref; chunkStart = _i += SpliceArrayChunkSize) {
          chunkEnd = chunkStart + SpliceArrayChunkSize;
          chunk = insertedArray.slice(chunkStart, chunkEnd);
          originalArray.splice.apply(originalArray, [start + chunkStart, 0].concat(__slice.call(chunk)));
        }
        return removedValues;
      }
    },
    newlineRegex: /\r\n|\n|\r/g
  };

}).call(this);
