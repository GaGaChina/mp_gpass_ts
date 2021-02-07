'use strict';

var ProtectedValue = require('../crypto/protected-value'),
    KdbxError = require('../errors/kdbx-error'),
    Consts = require('../defs/consts'),
    ByteUtils = require('../utils/byte-utils'),
    XmlUtils = require('../utils/xml-utils'),
    Random = require('../crypto/random'),
    CryptoEngine = require('../crypto/crypto-engine'),
    $g = require('../../../frame/speed.do').$g;

/**
 * Credentials
 * @param {ProtectedValue|null} password
 * @param {String|ArrayBuffer|Uint8Array|null} [keyFile]
 * @param challengeResponse {Function}
 * @constructor
 */
var KdbxCredentials = function (password, keyFile, challengeResponse) {
    var that = this;
    this.ready = Promise.all([
        this.setPassword(password),
        this.setKeyFile(keyFile),
        this.setChallengeResponse(challengeResponse)
    ]).then(function () {
        return that;
    });
};
KdbxCredentials.prototype.__name__ = 'KdbxCredentials'

/**
 * 设置密码, 设置完毕后直接为sha256, 而且未保存原始密码
 * @param {ProtectedValue|null} password
 */
KdbxCredentials.prototype.setPassword = function (password) {
    if (password === null) {
        this.passwordHash = null;
    } else if (!($g.isClass(password, 'ProtectedValue'))) {
        return Promise.reject(new KdbxError(Consts.ErrorCodes.InvalidArg, 'password'));
    } else {
        var that = this;
        // 正常返回: ArrayBuffer 32 Uint8Array
        return password.getHash().then(function (hash) {
            that.passwordHash = ProtectedValue.fromBinary(hash);
        });
    }
    return Promise.resolve();
};

/**
 * 设置 keyfile
 * @param {ArrayBuffer|Uint8Array|null} [keyFile]
 */
KdbxCredentials.prototype.setKeyFile = function (keyFile) {
    if (keyFile && !$g.isTypeMA(keyFile, ['ArrayBuffer', 'Uint8Array'])) {
        return Promise.reject(new KdbxError(Consts.ErrorCodes.InvalidArg, 'keyFile'));
    }
    if (keyFile) {
        if (keyFile.byteLength === 32) {
            this.keyFileHash = ProtectedValue.fromBinary(ByteUtils.arrayToBuffer(keyFile));
            return Promise.resolve();
        }
        var keyFileVersion;
        var dataEl;
        var that = this;
        try {
            var keyFileStr = ByteUtils.bytesToString(ByteUtils.arrayToBuffer(keyFile));
            if (keyFileStr.match(/^[a-f\d]{64}$/i)) {
                var bytes = ByteUtils.hexToBytes(keyFileStr);
                this.keyFileHash = ProtectedValue.fromBinary(bytes);
                return;
            }
            var xml = XmlUtils.parse(keyFileStr.trim());
            var metaEl = XmlUtils.getChildNode(xml.documentElement, 'Meta');
            var versionEl = XmlUtils.getChildNode(metaEl, 'Version');
            keyFileVersion = versionEl.textContent;
            var keyEl = XmlUtils.getChildNode(xml.documentElement, 'Key');
            dataEl = XmlUtils.getChildNode(keyEl, 'Data');
        } catch (e) {
            return CryptoEngine.sha256(keyFile).then(function (hash) {
                that.keyFileHash = ProtectedValue.fromBinary(hash);
            });
        }

        switch (keyFileVersion) {
            case '1.00':
            case 1: {
                this.keyFileHash = ProtectedValue.fromBinary(
                    ByteUtils.base64ToBytes(dataEl.textContent)
                );
                break;
            }
            case '2.0': {
                var keyFileData = ByteUtils.hexToBytes(dataEl.textContent.replace(/\s+/g, ''));
                var keyFileDataHash = dataEl.getAttribute('Hash');
                return CryptoEngine.sha256(keyFileData).then(function (computedHash) {
                    var computedHashStr = ByteUtils.bytesToHex(
                        new Uint8Array(computedHash).subarray(0, 4)
                    ).toUpperCase();
                    if (computedHashStr !== keyFileDataHash) {
                        throw new KdbxError(
                            Consts.ErrorCodes.FileCorrupt,
                            'Key file data hash mismatch'
                        );
                    }
                    that.keyFileHash = ProtectedValue.fromBinary(keyFileData);
                });
            }
            default: {
                return Promise.reject(
                    new KdbxError(Consts.ErrorCodes.FileCorrupt, 'Bad keyfile version')
                );
            }
        }
    } else {
        this.keyFileHash = null;
    }
    return Promise.resolve();
};

/**
 * Set a challenge-response module
 * @param challengeResponse {Function}
 */
KdbxCredentials.prototype.setChallengeResponse = function (challengeResponse) {
    this.challengeResponse = challengeResponse;
    return Promise.resolve();
};

/**
 * Get credentials hash
 * @returns {Promise.<ArrayBuffer>}
 */
KdbxCredentials.prototype.getHash = function (challenge) {
    var that = this;
    return this.ready.then(function () {
        return that.getChallengeResponse(challenge).then(function (chalResp) {
            var buffers = [];
            if (that.passwordHash) {
                buffers.push(that.passwordHash.getBinary());
            }
            if (that.keyFileHash) {
                buffers.push(that.keyFileHash.getBinary());
            }
            if (chalResp) {
                buffers.push(new Uint8Array(chalResp));
            }
            var totalLength = buffers.reduce(function (acc, buf) {
                return acc + buf.byteLength;
            }, 0);
            var allBytes = new Uint8Array(totalLength);
            var offset = 0;
            buffers.forEach(function (buffer) {
                allBytes.set(buffer, offset);
                ByteUtils.zeroBuffer(buffer);
                offset += buffer.length;
            });
            return CryptoEngine.sha256(ByteUtils.arrayToBuffer(allBytes)).then(function (hash) {
                ByteUtils.zeroBuffer(allBytes);
                return hash;
            });
        });
    });
};

KdbxCredentials.prototype.getChallengeResponse = function (challenge) {
    var challengeResponse = this.challengeResponse;
    return Promise.resolve().then(function () {
        if (!challengeResponse || !challenge) {
            return null;
        }
        return challengeResponse(challenge).then(function (response) {
            return CryptoEngine.sha256(ByteUtils.arrayToBuffer(response)).then(function (hash) {
                ByteUtils.zeroBuffer(response);
                return hash;
            });
        });
    });
};

/**
 * Creates random keyfile
 * @returns {Uint8Array}
 */
KdbxCredentials.createRandomKeyFile = function () {
    var keyLength = 32;
    var keyBytes = Random.getBytes(keyLength),
        salt = Random.getBytes(keyLength);
    for (var i = 0; i < keyLength; i++) {
        keyBytes[i] ^= salt[i];
        keyBytes[i] ^= (Math.random() * 1000) % 255;
    }
    var key = ByteUtils.bytesToBase64(keyBytes);
    return KdbxCredentials.createKeyFileWithHash(key);
};

/**
 * Creates keyfile by given hash
 * @param {string} hash base64-encoded hash
 * @returns {Uint8Array}
 */
KdbxCredentials.createKeyFileWithHash = function (hash) {
    var xml =
        '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<KeyFile>\n' +
        '    <Meta>\n' +
        '        <Version>1.00</Version>\n' +
        '    </Meta>\n' +
        '    <Key>\n' +
        '       <Data>' +
        hash +
        '</Data>\n' +
        '   </Key>\n' +
        '</KeyFile>';
    return ByteUtils.stringToBytes(xml);
    // 升级变化
    // var xmlVersion = '1.00';
    // if (version === 2) {
    //     xmlVersion = '2.0';
    // }
    // var dataPadding = '        ';
    // let makeDataElPromise;
    // if (version === 2) {
    //     var keyDataPadding = dataPadding + '    ';
    //     makeDataElPromise = CryptoEngine.sha256(keyBytes).then(function (computedHash) {
    //         var keyHash = ByteUtils.bytesToHex(
    //             new Uint8Array(computedHash).subarray(0, 4)
    //         ).toUpperCase();
    //         var keyStr = ByteUtils.bytesToHex(keyBytes).toUpperCase();
    //         var dataElXml = dataPadding + '<Data Hash="' + keyHash + '">\n';
    //         for (var num = 0; num < 2; num++) {
    //             var parts = [0, 1, 2, 3].map(function (ix) {
    //                 return keyStr.substr(num * 32 + ix * 8, 8);
    //             });
    //             dataElXml += keyDataPadding;
    //             dataElXml += parts.join(' ');
    //             dataElXml += '\n';
    //         }
    //         dataElXml += dataPadding + '</Data>\n';
    //         return dataElXml;
    //     });
    // } else {
    //     var dataElXml = dataPadding + '<Data>' + ByteUtils.bytesToBase64(keyBytes) + '</Data>\n';
    //     makeDataElPromise = Promise.resolve(dataElXml);
    // }
    // return makeDataElPromise.then((dataElXml) => {
    //     var xml =
    //         '<?xml version="1.0" encoding="utf-8"?>\n' +
    //         '<KeyFile>\n' +
    //         '    <Meta>\n' +
    //         '        <Version>' +
    //         xmlVersion +
    //         '</Version>\n' +
    //         '    </Meta>\n' +
    //         '    <Key>\n' +
    //         dataElXml +
    //         '    </Key>\n' +
    //         '</KeyFile>';
    //     return ByteUtils.stringToBytes(xml);
    // });
};

module.exports = KdbxCredentials;