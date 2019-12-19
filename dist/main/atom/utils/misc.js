"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Yields all initial subsequences of its first argument, starting
 *  from lengths given as the second argument
 *  @param str Input value. Can be a string, or an array, or frankly anything
 *             with the slice method and length
 *  @param startsWith Minimum init string length
 *  @returns All initial subsequences of str of length >= startsWith
 */
function* inits(str, startWith = 0) {
    for (let i = startWith; i <= str.length; ++i) {
        yield str.slice(0, i);
    }
}
exports.inits = inits;
//# sourceMappingURL=misc.js.map