function plus1(query) {
    return Promise.resolve({ num: query.num + 1 });
}
exports.plus1 = plus1;
