// Top level file is just a mixin of submodules & constants
'use strict';

const { Deflate, deflate, deflateRaw, gzip } = require('./deflate');

const { Inflate, inflate, inflateRaw, ungzip } = require('./inflate');

const constants = require('./zlib/constants');

module.exports.Deflate = Deflate;
module.exports.deflate = deflate;
module.exports.deflateRaw = deflateRaw;
module.exports.gzip = gzip;
module.exports.Inflate = Inflate;
module.exports.inflate = inflate;
module.exports.inflateRaw = inflateRaw;
module.exports.ungzip = ungzip;
module.exports.constants = constants;
