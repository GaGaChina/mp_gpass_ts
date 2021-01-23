'use strict';

var CryptoEngine = require('./../crypto/crypto-engine'),
    ByteUtils = require('./../utils/byte-utils'),
    $g = require('../../../frame/speed.do').$g;

var KdbxBinaries = function () {
    Object.defineProperties(this, {
        idToHash: { value: {} },
        hashOrder: { value: null, configurable: true }
    });
};

KdbxBinaries.prototype.__name__ = 'KdbxBinaries'

KdbxBinaries.prototype.hash = function () {
    var promises = [];
    var that = this;
    Object.keys(that).forEach(function (id) {
        var binary = that[id];
        promises.push(
            that.getBinaryHash(binary).then(function (hash) {
                that.idToHash[id] = hash;
                that[hash] = that[id];
                delete that[id];
            })
        );
    });
    return Promise.all(promises);
};

KdbxBinaries.prototype.getBinaryHash = function (binary) {
    var promise;
    if ($g.isClass(binary, 'ProtectedValue')) {
        promise = binary.getHash();
    } else if ($g.isTypeMA(binary, ['ArrayBuffer', 'Uint8Array'])) {
        binary = ByteUtils.arrayToBuffer(binary);
        promise = CryptoEngine.sha256(binary);
    }
    return promise.then(function (hash) {
        return ByteUtils.bytesToHex(hash);
    });
};

KdbxBinaries.prototype.assignIds = function () {
    Object.defineProperty(this, 'hashOrder', { value: Object.keys(this), configurable: true });
};

KdbxBinaries.prototype.add = function (value) {
    var that = this;
    return this.getBinaryHash(value).then(function (hash) {
        that[hash] = value;
        return { ref: hash, value: value };
    });
};

module.exports = KdbxBinaries;
