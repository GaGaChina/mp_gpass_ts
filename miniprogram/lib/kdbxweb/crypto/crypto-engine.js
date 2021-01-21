'use strict';

var ByteUtils = require('../utils/byte-utils'),
    KdbxError = require('../errors/kdbx-error'),
    Consts = require('../defs/consts'),
    ChaCha20 = require('./chacha20');

var CryptoJS = require('./../../crypto-js/crypto-js')

var ToolNumber = require('./../../../frame/tools/tool.number').ToolNumber
var ToolBytes = require('./../../../frame/tools/tool.bytes').ToolBytes

var webCrypto = global.crypto;
var subtle = webCrypto ? webCrypto.subtle || webCrypto.webkitSubtle : null;
var nodeCrypto =
    global.process && global.process.versions && global.process.versions.node ?
    require('crypto') :
    null;
// 空值的 Sha256
var EmptySha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
// 空值的 Sha512
var EmptySha512 = 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e';
// maxRandomQuota is the max number of random bytes you can asks for from the cryptoEngine
// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
var maxRandomQuota = 65536;

/**
 * SHA-256 hash
 * @param {ArrayBuffer} data
 * @returns {Promise.<ArrayBuffer>}
 */
function sha256(data) {
    if (!data.byteLength) {
        return Promise.resolve(ByteUtils.arrayToBuffer(ByteUtils.hexToBytes(EmptySha256)));
    }
    return new Promise(function (resolve) {
        const word = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(data))
        const typedArray = ToolBytes.CryptJsWordArrayToUint8Array(word)
        resolve(typedArray.buffer)
    })
}

/**
 * SHA-512 hash
 * @param {ArrayBuffer} data
 * @returns {Promise.<ArrayBuffer>}
 */
function sha512(data) {
    if (!data.byteLength) {
        return Promise.resolve(ByteUtils.arrayToBuffer(ByteUtils.hexToBytes(EmptySha512)));
    }
    return new Promise(function (resolve) {
        const word = CryptoJS.SHA512(CryptoJS.lib.WordArray.create(data))
        const typedArray = ToolBytes.CryptJsWordArrayToUint8Array(word)
        resolve(typedArray.buffer)
    })
}

/**
 * HMAC-SHA-256 hash
 * @param {ArrayBuffer} key
 * @param {ArrayBuffer} data
 * @returns {Promise.<ArrayBuffer>}
 */
function hmacSha256(key, data) {
    return new Promise(function (resolve) {
        const word = CryptoJS.HmacSHA256(CryptoJS.lib.WordArray.create(key), CryptoJS.lib.WordArray.create(data))
        const typedArray = ToolBytes.CryptJsWordArrayToUint8Array(word)
        resolve(typedArray.buffer)
    })
}

// AES-CBC using CryptoJS
function AesCbcCryptoJS() {}
/**
 * 导入key
 * @param {ArrayBuffer} key 
 */
AesCbcCryptoJS.prototype.importKey = function (key) {
    this.key = CryptoJS.lib.WordArray.create(key)
    return Promise.resolve();
};

/**
 * 加密
 * @param {Uint8Array | ArrayBuffer} data 可以用这个 ByteUtils.arrayToBuffer 这里直接取内部值
 * @param {ArrayBuffer} iv 
 */
AesCbcCryptoJS.prototype.encrypt = function (data, iv) {
    var that = this;
    return Promise.resolve().then(function () {
        const wordIn = CryptoJS.lib.WordArray.create(ByteUtils.arrayToBuffer(data))
        const wordIV = CryptoJS.lib.WordArray.create(iv)
        const wordOut = CryptoJS.AES.encrypt(wordIn, that.key, {
            iv: wordIV,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        })
        const typedArray = ToolBytes.CryptJsWordArrayToUint8Array(wordOut.ciphertext)
        return typedArray.buffer;
    })
};

/**
 * 解密
 * @param {ArrayBuffer} data 
 * @param {ArrayBuffer} iv 
 */
AesCbcCryptoJS.prototype.decrypt = function (data, iv) {
    var that = this;
    return Promise.resolve().then(function () {
        // const BaseIn = CryptoJS.enc.Base64.stringify(CryptoJS.lib.WordArray.create(data))
        // const BaseIn = ToolBytes.ArrayBufferToBase64(data)
        const wordData = CryptoJS.lib.WordArray.create(data)
        const ciphertext = CryptoJS.lib.CipherParams.create({ ciphertext: wordData})
        const wordIV = CryptoJS.lib.WordArray.create(iv)
        const wordOut = CryptoJS.AES.decrypt(ciphertext, that.key, {
            iv: wordIV,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        })
        const typeArray = ToolBytes.CryptJsWordArrayToUint8Array(wordOut)
        return typeArray.buffer
    }).catch(function (error) {
        throw new KdbxError(Consts.ErrorCodes.InvalidKey, 'invalid key Error : ', error);
    });
};

/**
 * 自己做的创建 AES-CBC implementation
 * @returns AesCbc
 */
function createAesCbc() {
    return new AesCbcCryptoJS();
}

/**
 * Gets random bytes from the CryptoEngine
 * @param {number} len - bytes count
 * @return {Uint8Array} - random bytes
 */
function safeRandom(len) {
    var randomBytes = new Uint8Array(len);
    while (len > 0) {
        var segmentSize = len % maxRandomQuota;
        segmentSize = segmentSize > 0 ? segmentSize : maxRandomQuota;
        var randomBytesSegment = new Uint8Array(segmentSize);
        // 用新方法替换
        ToolNumber.getRandomValues(randomBytesSegment);
        len -= segmentSize;
        randomBytes.set(randomBytesSegment, len);
    }
    return randomBytes;
}

/**
 * Generates random bytes of specified length
 * @param {Number} len
 * @returns {Uint8Array}
 */
function random(len) {
    return safeRandom(len);
}

/**
 * Encrypts with ChaCha20
 * @param {ArrayBuffer} data
 * @param {ArrayBuffer} key
 * @param {ArrayBuffer} iv
 * @returns {Promise.<ArrayBuffer>}
 */
function chacha20(data, key, iv) {
    return Promise.resolve().then(function () {
        var algo = new ChaCha20(new Uint8Array(key), new Uint8Array(iv));
        return ByteUtils.arrayToBuffer(algo.encrypt(new Uint8Array(data)));
    });
}

/**
 * Argon2 hash
 * @param {ArrayBuffer} password
 * @param {ArrayBuffer} salt
 * @param {Number} memory - memory in KiB
 * @param {Number} iterations - number of iterations
 * @param {Number} length - hash length
 * @param {Number} parallelism - threads count (threads will be emulated if they are not supported)
 * @param {Number} type - Argon2TypeArgon2d or Argon2TypeArgon2id
 * @param {Number} version - 0x10 or 0x13
 * @returns {Promise.<ArrayBuffer>}
 */
function argon2(password, salt, memory, iterations, length, parallelism, type, version) {
    return Promise.reject(
        new KdbxError(Consts.ErrorCodes.NotImplemented, 'Argon2 not implemented')
    );
}

/**
 * Configures globals, for tests
 */
function configure(newSubtle, newWebCrypto, newNodeCrypto) {
    subtle = newSubtle;
    webCrypto = newWebCrypto;
    nodeCrypto = newNodeCrypto;
}

module.exports.subtle = subtle;
module.exports.webCrypto = webCrypto;
module.exports.nodeCrypto = nodeCrypto;

module.exports.sha256 = sha256;
module.exports.sha512 = sha512;
module.exports.hmacSha256 = hmacSha256;
module.exports.random = random;
module.exports.createAesCbc = createAesCbc;
module.exports.chacha20 = chacha20;
module.exports.argon2 = argon2;
module.exports.Argon2TypeArgon2d = 0;
module.exports.Argon2TypeArgon2id = 2;

module.exports.configure = configure;
