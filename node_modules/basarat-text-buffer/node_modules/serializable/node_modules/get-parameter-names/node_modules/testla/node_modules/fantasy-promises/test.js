var Promise = require('./index'),
    fs = require('fs');

exports.testReadFile = function(test) {
    var promise = new Promise(function(resolve, reject) {
        fs.readFile(__filename, 'utf8', function(error, data) {
            if(error) return reject(error);
            resolve(data);
        });
    });

    promise.fork(function(data) {
        test.ok(true);
        test.done();
    });
};

exports.testOf = function(test) {
    var promise = Promise.of(41);
    promise.fork(function(data) {
        test.equal(41, data);
        test.done();
    });
};


exports.testChain = function(test) {
    var promise = Promise.of(41).chain(function(a) { return Promise.of(a + 1); });
    promise.fork(function(data) {
        test.equal(42, data);
        test.done();
    });
};

exports.testMap = function(test) {
    var promise = Promise.of(41).map(function(a) { return a + 1; });
    promise.fork(function(data) {
        test.equal(42, data);
        test.done();
    });
};

exports.testJoin = function(test) {
    var promise = Promise.of(Promise.of(42)).chain(function(a) { return a; });
    promise.fork(function(data) {
        test.equal(42, data);
        test.done();
    });
};

exports.testExtract = function(test) {
    var promise = Promise.of(41).map(function(x) { return x + 1; });
    test.equal(42, promise.extract());
    test.done();
};

exports.testExtend = function(test) {
    var promise = new Promise(function(resolve) {
        setTimeout(function() {
            resolve("100 ms");
        }, 100);
    }).extend(function(p) {
        return p.extract().toUpperCase();
    }).fork(function(data) {
        test.equal("100 MS", data);
        test.done();
    });
};
