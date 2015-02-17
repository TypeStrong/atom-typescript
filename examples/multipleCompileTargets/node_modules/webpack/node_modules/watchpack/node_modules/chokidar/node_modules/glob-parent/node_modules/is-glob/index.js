/*!
 * is-glob <https://github.com/jonschlinkert/is-glob>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function isGlob(str) {
  return typeof str === 'string'
    && /[*{}?[\]]|(?:\(.*\|.*\))/.test(str);
};