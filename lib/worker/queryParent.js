function echoNumWithModification(query) {
    return Promise.resolve({ num: query.num + 10 });
}
exports.echoNumWithModification = echoNumWithModification;
