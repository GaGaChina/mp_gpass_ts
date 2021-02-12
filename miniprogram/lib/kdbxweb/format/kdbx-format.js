'use strict';

var pako = require('./../../pako/index'),
    KdbxError = require('../errors/kdbx-error'),
    KdbxHeader = require('./kdbx-header'),
    KdbxContext = require('./kdbx-context'),
    CryptoEngine = require('../crypto/crypto-engine'),
    BinaryStream = require('../utils/binary-stream'),
    ByteUtils = require('../utils/byte-utils'),
    XmlUtils = require('../utils/xml-utils'),
    Int64 = require('../utils/int64'),
    Consts = require('../defs/consts'),
    HashedBlockTransform = require('../crypto/hashed-block-transform'),
    HmacBlockTransform = require('../crypto/hmac-block-transform'),
    ProtectSaltGenerator = require('../crypto/protect-salt-generator'),
    KeyEncryptorAes = require('../crypto/key-encryptor-aes'),
    KeyEncryptorKdf = require('../crypto/key-encryptor-kdf'),
    $g = require('../../../frame/speed.do').$g;

var KdbxFormat = function (kdbx) {
    this.kdbx = kdbx;
};
KdbxFormat.prototype.__name__ = 'KdbxFormat'

/**
 * Load kdbx file
 * If there was an error loading file, throws an exception
 * @param {ArrayBuffer} data - database file contents
 * @returns {Promise.<Kdbx>}
 */
KdbxFormat.prototype.load = function (data) {
    var stm = new BinaryStream(data);
    var kdbx = this.kdbx;
    var that = this;
    that.ctx = new KdbxContext({
        kdbx: kdbx
    });
    return kdbx.credentials.ready.then(function () {
        // $g.log('[KdbxFormat]证书准备完毕')
        kdbx.header = KdbxHeader.read(stm, that.ctx);
        // $g.log('[KdbxFormat]头部读取完毕')
        if (kdbx.header.versionMajor === 3) {
            return that._loadV3(stm);
        } else if (kdbx.header.versionMajor === 4) {
            return that._loadV4(stm);
        } else {
            throw new KdbxError(
                Consts.ErrorCodes.InvalidVersion,
                'bad version: ' + kdbx.header.versionMajor
            );
        }
    });
};

KdbxFormat.prototype._loadV3 = function (stm) {
    var kdbx = this.kdbx;
    var that = this;
    $g.log('[KdbxFormat]loadV3');
    return that._decryptXmlV3(kdbx, stm).then(function (xmlStr) {
        // $g.log('[KdbxFormat]loadV3 解析XML:', xmlStr);
        kdbx.xml = XmlUtils.parse(xmlStr);
        return that._setProtectedValues().then(function () {
            return kdbx._loadFromXml(that.ctx).then(function () {
                $g.log('[KdbxFormat]XML 载入完毕')
                return that._checkHeaderHashV3(stm).then(function () {
                    return kdbx;
                });
            });
        });
    });
};

KdbxFormat.prototype._loadV4 = function (stm) {
    $g.log('[KdbxFormat]loadV4');
    var that = this;
    return that._getHeaderHash(stm).then(function (headerSha) {
        var expectedHeaderSha = stm.readBytes(headerSha.byteLength);
        if (!ByteUtils.arrayBufferEquals(expectedHeaderSha, headerSha)) {
            throw new KdbxError(Consts.ErrorCodes.FileCorrupt, 'header hash mismatch');
        }
        return that._computeKeysV4().then(function (keys) {
            return that._getHeaderHmac(stm, keys.hmacKey).then(function (headerHmac) {
                var expectedHeaderHmac = stm.readBytes(headerHmac.byteLength);
                if (!ByteUtils.arrayBufferEquals(expectedHeaderHmac, headerHmac)) {
                    throw new KdbxError(Consts.ErrorCodes.InvalidKey);
                }
                return HmacBlockTransform.decrypt(stm.readBytesToEnd(), keys.hmacKey).then(
                    function (data) {
                        ByteUtils.zeroBuffer(keys.hmacKey);
                        return that._decryptData(data, keys.cipherKey).then(function (data) {
                            ByteUtils.zeroBuffer(keys.cipherKey);
                            $g.log('[KdbxFormat]loadV4 decryptData');
                            if (that.kdbx.header.compression === Consts.CompressionAlgorithm.GZip) {
                                // $g.log('[KdbxFormat]loadV4 ungzip', data);
                                data = pako.ungzip(data);
                            }
                            stm = new BinaryStream(ByteUtils.arrayToBuffer(data));
                            // $g.log('[KdbxFormat]loadV4 readInnerHeader', stm);
                            that.kdbx.header.readInnerHeader(stm, that.ctx);
                            data = stm.readBytesToEnd();
                            // $g.log('[KdbxFormat]loadV4 readBytesToEnd', data);
                            var xmlStr = ByteUtils.bytesToString(data);
                            // $g.log('[KdbxFormat]loadV4 XmlUtils.parse', xmlStr);
                            that.kdbx.xml = XmlUtils.parse(xmlStr);
                            return that._setProtectedValues().then(function () {
                                return that.kdbx._loadFromXml(that.ctx);
                            });
                        });
                    }
                );
            });
        });
    });
};

/**
 * Load XML file
 * @param {string} xmlStr
 * @returns {Promise.<Kdbx>}
 */
KdbxFormat.prototype.loadXml = function (xmlStr) {
    var kdbx = this.kdbx;
    var ctx = new KdbxContext({
        kdbx: kdbx
    });
    return kdbx.credentials.ready.then(function () {
        kdbx.header = KdbxHeader.create();
        kdbx.xml = XmlUtils.parse(xmlStr);
        XmlUtils.protectPlainValues(kdbx.xml.documentElement);
        return kdbx._loadFromXml(ctx);
    });
};

/**
 * Save kdbx file
 * @returns {Promise.<ArrayBuffer>}
 */
KdbxFormat.prototype.save = function () {
    var kdbx = this.kdbx;
    var that = this;
    that.ctx = new KdbxContext({
        kdbx: kdbx
    });
    kdbx.binaries.assignIds();
    return kdbx.credentials.ready.then(function () {
        var stm = new BinaryStream();
        kdbx.header.generateSalts();
        kdbx.header.write(stm);
        if (kdbx.header.versionMajor === 3) {
            return that._saveV3(stm);
        } else if (kdbx.header.versionMajor === 4) {
            return that._saveV4(stm);
        } else {
            throw new KdbxError(
                Consts.ErrorCodes.InvalidVersion,
                'bad version: ' + kdbx.header.versionMajor
            );
        }
    });
};

KdbxFormat.prototype._saveV3 = function (stm) {
    var that = this;
    return that._getHeaderHash(stm).then(function (headerHash) {
        that.kdbx.meta.headerHash = headerHash;
        that.kdbx._buildXml(that.ctx);
        return that._getProtectSaltGenerator().then(function (gen) {
            XmlUtils.updateProtectedValuesSalt(that.kdbx.xml.documentElement, gen);
            return that._encryptXmlV3().then(function (data) {
                stm.writeBytes(data);
                return stm.getWrittenBytes();
            });
        });
    });
};

KdbxFormat.prototype._saveV4 = function (stm) {
    var that = this;
    that.kdbx._buildXml(that.ctx);
    return that._getHeaderHash(stm).then(function (headerSha) {
        stm.writeBytes(headerSha);
        return that._computeKeysV4().then(function (keys) {
            return that._getHeaderHmac(stm, keys.hmacKey).then(function (headerHmac) {
                stm.writeBytes(headerHmac);
                return that._getProtectSaltGenerator().then(function (gen) {
                    XmlUtils.updateProtectedValuesSalt(that.kdbx.xml.documentElement, gen);
                    var xml = XmlUtils.serialize(that.kdbx.xml);
                    var innerHeaderStm = new BinaryStream();
                    that.kdbx.header.writeInnerHeader(innerHeaderStm, that.ctx);
                    var innerHeaderData = innerHeaderStm.getWrittenBytes();
                    var xmlData = ByteUtils.arrayToBuffer(ByteUtils.stringToBytes(xml));
                    var data = new ArrayBuffer(innerHeaderData.byteLength + xmlData.byteLength);
                    var dataArr = new Uint8Array(data);
                    dataArr.set(new Uint8Array(innerHeaderData));
                    dataArr.set(new Uint8Array(xmlData), innerHeaderData.byteLength);
                    ByteUtils.zeroBuffer(xmlData);
                    ByteUtils.zeroBuffer(innerHeaderData);
                    if (that.kdbx.header.compression === Consts.CompressionAlgorithm.GZip) {
                        data = pako.gzip(data);
                    }
                    return that
                        ._encryptData(ByteUtils.arrayToBuffer(data), keys.cipherKey)
                        .then(function (data) {
                            ByteUtils.zeroBuffer(keys.cipherKey);
                            return HmacBlockTransform.encrypt(data, keys.hmacKey).then(function (
                                data
                            ) {
                                ByteUtils.zeroBuffer(keys.hmacKey);
                                stm.writeBytes(data);
                                return stm.getWrittenBytes();
                            });
                        });
                });
            });
        });
    });
};

KdbxFormat.prototype.saveXml = function (prettyPrint) {
    var kdbx = this.kdbx;
    return kdbx.credentials.ready.then(function () {
        kdbx.header.generateSalts();
        var ctx = new KdbxContext({
            kdbx: kdbx,
            exportXml: true
        });
        kdbx.binaries.assignIds();
        kdbx._buildXml(ctx);
        XmlUtils.unprotectValues(kdbx.xml.documentElement);
        var xml = XmlUtils.serialize(kdbx.xml, prettyPrint);
        XmlUtils.protectUnprotectedValues(kdbx.xml.documentElement);
        return xml;
    });
};

KdbxFormat.prototype._decryptXmlV3 = function (kdbx, stm) {
    var data = stm.readBytesToEnd();
    var that = this;
    $g.log('[KdbxFormat]decryptXmlV3');
    return that._getMasterKeyV3().then(function (masterKey) {
        $g.log('[KdbxFormat]decryptXmlV3 decryptData');
        return that._decryptData(data, masterKey).then(function (data) {
            $g.log('[KdbxFormat]decryptXmlV3 zeroBuffer');
            ByteUtils.zeroBuffer(masterKey);
            data = that._trimStartBytesV3(data);
            $g.log('[KdbxFormat]decryptXmlV3 decrypt');
            return HashedBlockTransform.decrypt(data).then(function (data) {
                $g.log('[KdbxFormat]decryptXmlV3 decrypt ok');
                if (that.kdbx.header.compression === Consts.CompressionAlgorithm.GZip) {
                    // $g.log('[KdbxFormat]decryptXmlV3 ungzip 启动 : ', data);
                    // $g.log('[KdbxFormat]ungzip 启动')
                    data = pako.ungzip(data);
                    // $g.log('[KdbxFormat]ungzip 完毕')
                    // $g.log('[KdbxFormat]decryptXmlV3 ungzip 结束 : ', data);
                }
                // $g.log('[KdbxFormat]decryptXmlV3 准备读XML', data);
                return ByteUtils.bytesToString(data);
            });
        });
    });
};

KdbxFormat.prototype._encryptXmlV3 = function () {
    var kdbx = this.kdbx;
    var that = this;
    var xml = XmlUtils.serialize(kdbx.xml);
    var data = ByteUtils.arrayToBuffer(ByteUtils.stringToBytes(xml));
    if (kdbx.header.compression === Consts.CompressionAlgorithm.GZip) {
        data = pako.gzip(data);
    }
    return HashedBlockTransform.encrypt(ByteUtils.arrayToBuffer(data)).then(function (data) {
        var ssb = new Uint8Array(kdbx.header.streamStartBytes);
        var newData = new Uint8Array(data.byteLength + ssb.length);
        newData.set(ssb);
        newData.set(new Uint8Array(data), ssb.length);
        data = newData;
        return that._getMasterKeyV3().then(function (masterKey) {
            $g.log('[KdbxFormat]encryptXmlV3:解密');
            return that
                ._encryptData(ByteUtils.arrayToBuffer(data), masterKey)
                .then(function (data) {
                    ByteUtils.zeroBuffer(masterKey);
                    return data;
                });
        });
    });
};

KdbxFormat.prototype._getMasterKeyV3 = function () {
    var kdbx = this.kdbx;
    $g.log('[KdbxFormat]getMasterKeyV3');
    return kdbx.credentials.getHash().then(function (credHash) {
        var transformSeed = kdbx.header.transformSeed;
        var transformRounds = kdbx.header.keyEncryptionRounds;
        var masterSeed = kdbx.header.masterSeed;

        return kdbx.credentials.getChallengeResponse(masterSeed).then(function (chalResp) {
            $g.log('[KdbxFormat]getMasterKeyV3:AES');
            return KeyEncryptorAes.encrypt(
                new Uint8Array(credHash),
                transformSeed,
                transformRounds
            ).then(function (encKey) {
                $g.log('[KdbxFormat]getMasterKeyV3:encKey');
                ByteUtils.zeroBuffer(credHash);
                return CryptoEngine.sha256(encKey).then(function (keyHash) {
                    ByteUtils.zeroBuffer(encKey);
                    var chalRespLength = chalResp ? chalResp.byteLength : 0;
                    var all = new Uint8Array(
                        masterSeed.byteLength + keyHash.byteLength + chalRespLength
                    );
                    all.set(new Uint8Array(masterSeed), 0);
                    if (chalResp) {
                        all.set(new Uint8Array(chalResp), masterSeed.byteLength);
                    }
                    all.set(new Uint8Array(keyHash), masterSeed.byteLength + chalRespLength);
                    ByteUtils.zeroBuffer(keyHash);
                    ByteUtils.zeroBuffer(masterSeed);
                    if (chalResp) {
                        ByteUtils.zeroBuffer(chalResp);
                    }
                    $g.log('[KdbxFormat]getMasterKeyV3:sha256 Key');
                    return CryptoEngine.sha256(all.buffer).then(function (masterKey) {
                        $g.log('[KdbxFormat]getMasterKeyV3:sha256 Key OK all.buffer:', all.buffer.byteLength);
                        ByteUtils.zeroBuffer(all.buffer);
                        $g.log('[KdbxFormat]getMasterKeyV3:zeroBuffer OK');
                        return masterKey;
                    });
                });
            });
        });
    });
};

KdbxFormat.prototype._trimStartBytesV3 = function (data) {
    $g.log('[KdbxFormat]trimStartBytesV3');
    var ssb = this.kdbx.header.streamStartBytes;
    if (data.byteLength < ssb.byteLength) {
        throw new KdbxError(Consts.ErrorCodes.FileCorrupt, 'short start bytes');
    }
    if (!ByteUtils.arrayBufferEquals(data.slice(0, this.kdbx.header.streamStartBytes.byteLength), ssb)) {
        throw new KdbxError(Consts.ErrorCodes.InvalidKey);
    }
    $g.log('[KdbxFormat]trimStartBytesV3 ok');
    return data.slice(ssb.byteLength);
};

KdbxFormat.prototype._setProtectedValues = function () {
    var kdbx = this.kdbx;
    return this._getProtectSaltGenerator().then(function (gen) {
        XmlUtils.setProtectedValues(kdbx.xml.documentElement, gen);
    });
};

KdbxFormat.prototype._getProtectSaltGenerator = function () {
    return ProtectSaltGenerator.create(
        this.kdbx.header.protectedStreamKey,
        this.kdbx.header.crsAlgorithm
    );
};

KdbxFormat.prototype._getHeaderHash = function (stm) {
    var src = stm.readBytesNoAdvance(0, this.kdbx.header.endPos);
    return CryptoEngine.sha256(src);
};

KdbxFormat.prototype._getHeaderHmac = function (stm, key) {
    var src = stm.readBytesNoAdvance(0, this.kdbx.header.endPos);
    return HmacBlockTransform.getHmacKey(key, new Int64(0xffffffff, 0xffffffff)).then(function (
        keySha
    ) {
        return CryptoEngine.hmacSha256(keySha, src);
    });
};

KdbxFormat.prototype._checkHeaderHashV3 = function (stm) {
    if (this.kdbx.meta.headerHash) {
        var metaHash = this.kdbx.meta.headerHash;
        return this._getHeaderHash(stm).then(function (actualHash) {
            if (!ByteUtils.arrayBufferEquals(metaHash, actualHash)) {
                throw new KdbxError(Consts.ErrorCodes.FileCorrupt, 'header hash mismatch');
            }
        });
    } else {
        return Promise.resolve();
    }
};

KdbxFormat.prototype._computeKeysV4 = function () {
    var that = this;
    var masterSeed = that.kdbx.header.masterSeed;
    if (!masterSeed || masterSeed.byteLength !== 32) {
        return Promise.reject(new KdbxError(Consts.ErrorCodes.FileCorrupt, 'bad master seed'));
    }
    var kdfParams = that.kdbx.header.kdfParameters;
    var kdfSalt = kdfParams.get('S');
    return that.kdbx.credentials.getHash(kdfSalt).then(function (credHash) {
        return KeyEncryptorKdf.encrypt(credHash, kdfParams).then(function (encKey) {
            ByteUtils.zeroBuffer(credHash);
            if (!encKey || encKey.byteLength !== 32) {
                return Promise.reject(
                    new KdbxError(Consts.ErrorCodes.Unsupported, 'bad derived key')
                );
            }
            var keyWithSeed = new Uint8Array(65);
            keyWithSeed.set(new Uint8Array(masterSeed), 0);
            keyWithSeed.set(new Uint8Array(encKey), masterSeed.byteLength);
            keyWithSeed[64] = 1;
            ByteUtils.zeroBuffer(encKey);
            ByteUtils.zeroBuffer(masterSeed);
            return Promise.all([
                CryptoEngine.sha256(keyWithSeed.buffer.slice(0, 64)),
                CryptoEngine.sha512(keyWithSeed.buffer)
            ]).then(function (keys) {
                ByteUtils.zeroBuffer(keyWithSeed);
                return {
                    cipherKey: keys[0],
                    hmacKey: keys[1]
                };
            });
        });
    });
};

/** 执行 AES 等解密 */
KdbxFormat.prototype._decryptData = function (data, cipherKey) {
    var cipherId = this.kdbx.header.dataCipherUuid;
    switch (cipherId.toString()) {
        case Consts.CipherId.Aes:
            $g.log('[KdbxFormat]decryptData AES');
            return this._transformDataV4Aes(data, cipherKey, false);
        case Consts.CipherId.ChaCha20:
            $g.log('[KdbxFormat]decryptData transformDataV4ChaCha20');
            return this._transformDataV4ChaCha20(data, cipherKey);
        default:
            return Promise.reject(
                new KdbxError(Consts.ErrorCodes.Unsupported, 'unsupported cipher')
            );
    }
};

/** 执行 AES 等加密 */
KdbxFormat.prototype._encryptData = function (data, cipherKey) {
    var cipherId = this.kdbx.header.dataCipherUuid;
    switch (cipherId.toString()) {
        case Consts.CipherId.Aes:
            return this._transformDataV4Aes(data, cipherKey, true);
        case Consts.CipherId.ChaCha20:
            return this._transformDataV4ChaCha20(data, cipherKey);
        default:
            return Promise.reject(
                new KdbxError(Consts.ErrorCodes.Unsupported, 'unsupported cipher')
            );
    }
};

KdbxFormat.prototype._transformDataV4Aes = function (data, cipherKey, encrypt) {
    var that = this;
    var aesCbc = CryptoEngine.createAesCbc();
    $g.log('[KdbxFormat]transformDataV4Aes');
    return aesCbc.importKey(cipherKey).then(function () {
        $g.log('[KdbxFormat]transformDataV4Aes encrypt');
        return encrypt ?
            aesCbc.encrypt(data, that.kdbx.header.encryptionIV) :
            aesCbc.decrypt(data, that.kdbx.header.encryptionIV);
    });
};

KdbxFormat.prototype._transformDataV4ChaCha20 = function (data, cipherKey) {
    return CryptoEngine.chacha20(data, cipherKey, this.kdbx.header.encryptionIV);
};

module.exports = KdbxFormat;