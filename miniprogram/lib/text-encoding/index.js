// This is free and unencumbered software released into the public domain.
// See LICENSE.md for more information.
// new TextDecoder().decode(new TextEncoder().encode('1234'))
var encoding = require("./lib/encoding.js");

module.exports = {
  TextEncoder: encoding.TextEncoder,
  TextDecoder: encoding.TextDecoder,
  EncodingIndexes: encoding.EncodingIndexes,
};