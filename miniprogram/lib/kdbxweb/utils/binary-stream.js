'use strict';

const { $g } = require("../../../frame/speed.do").$g;

/**
 * Stream for accessing array buffer with auto-advanced position
 * @param {ArrayBuffer} [arrayBuffer]
 * @constructor
 */
function BinaryStream(arrayBuffer) {
    // 原始的 arrayBuffer 数据引用
    this._arrayBuffer = arrayBuffer || new ArrayBuffer(1024);
    // 数据操作对象 DataView
    this._dataView = new DataView(this._arrayBuffer);
    // 数据的偏移量
    this._pos = 0;
    this._canExpand = !arrayBuffer;
}

/**
 * 没有代码提示
 * getInt8, getInt16, getInt32, getUint8, getUint16, getUint32, getFloat32, getFloat64
 * setInt8, setInt16, setInt32, setUint8, setUint16, setUint32, setFloat32, setFloat64
 * Int 1 * 8, Int 2 * 8, Int 4 * 8
 * Uint 1 * 8, Uint 2 * 8, Uint 4 * 8
 * Float 4 * 8, Float 8 * 8
 */
['Int', 'Uint', 'Float'].forEach(function (type) {
    (type === 'Float' ? [4, 8] : [1, 2, 4]).forEach(function (bytes) {
        var getMethod = 'get' + type + bytes * 8;
        BinaryStream.prototype[getMethod] = function (littleEndian) {
            var res = this._dataView[getMethod].call(this._dataView, this._pos, littleEndian);
            this._pos += bytes;
            return res;
        };
        var setMethod = 'set' + type + bytes * 8;
        BinaryStream.prototype[setMethod] = function (value, littleEndian) {
            this._checkCapacity(bytes);
            this._dataView[setMethod].call(this._dataView, this._pos, value, littleEndian);
            this._pos += bytes;
        };
    });
});

BinaryStream.prototype.getUint64 = function (littleEndian) {
    var part1 = this.getUint32(littleEndian),
        part2 = this.getUint32(littleEndian);
    if (littleEndian) {
        part2 *= 0x100000000;
    } else {
        part1 *= 0x100000000;
    }
    return part1 + part2;
};

BinaryStream.prototype.setUint64 = function (value, littleEndian) {
    this._checkCapacity(8);
    if (littleEndian) {
        this.setUint32(value & 0xffffffff, true);
        this.setUint32(Math.floor(value / 0x100000000), true);
    } else {
        this.setUint32(Math.floor(value / 0x100000000), false);
        this.setUint32(value & 0xffffffff, false);
    }
};

BinaryStream.prototype.readBytes = function (size) {
    var buffer = this._arrayBuffer.slice(this._pos, this._pos + size);
    this._pos += size;
    return buffer;
};

// 从现在的位置读取到末尾
BinaryStream.prototype.readBytesToEnd = function () {
    var size = this._arrayBuffer.byteLength - this._pos;
    return this.readBytes(size);
};

BinaryStream.prototype.readBytesNoAdvance = function (startPos, endPos) {
    return this._arrayBuffer.slice(startPos, endPos);
};

// 写入 bytes 并将定位移动到字节长度
BinaryStream.prototype.writeBytes = function (bytes) {
    if ($g.isTypeM(bytes, 'ArrayBuffer')) {
        bytes = new Uint8Array(bytes);
    }
    this._checkCapacity(bytes.length);
    // 从 _arrayBuffer 的 _pos 开始, 写入 bytes
    new Uint8Array(this._arrayBuffer).set(bytes, this._pos);
    this._pos += bytes.length;
};

BinaryStream.prototype.getWrittenBytes = function () {
    return this._arrayBuffer.slice(0, this._pos);
};

// 检测添加多少长度后, 空间是否够, 不够创建新二进制(长度为翻倍), 把老内容复制进去
BinaryStream.prototype._checkCapacity = function (addBytes) {
    // 剩余的写入长度
    var available = this._arrayBuffer.byteLength - this._pos;
    if (this._canExpand && available < addBytes) {
        var newLen = this._arrayBuffer.byteLength,
            requestedLen = this._pos + addBytes;
        while (newLen < requestedLen) {
            newLen += 1024;
        }
        var newData = new Uint8Array(newLen);
        newData.set(new Uint8Array(this._arrayBuffer));
        this._arrayBuffer = newData.buffer;
        this._dataView = new DataView(this._arrayBuffer);
    }
};

Object.defineProperty(BinaryStream.prototype, 'pos', {
    enumerable: true,
    get: function () {
        return this._pos;
    }
});

Object.defineProperty(BinaryStream.prototype, 'byteLength', {
    enumerable: true,
    get: function () {
        return this._arrayBuffer.byteLength;
    }
});

module.exports = BinaryStream;