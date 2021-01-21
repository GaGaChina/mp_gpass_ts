const { EncodingIndexes } = require('../../text-encoding/EncodingIndexes');
const textEncoding = require('./../../text-encoding/index');
EncodingIndexes.init(textEncoding.EncodingIndexes)
const textEncoder = new textEncoding.TextEncoder();
const textDecoder = new textEncoding.TextDecoder();

export class GByteStream {

    /** 当未传值创建新的时候的长度 */
    public static CREAT_LEN = 128
    /** 每次自动伸缩的时候的长度 */
    public static EXPAND_LEN = 64

    /** 是否使用 littleEdian, BIG_ENDIAN : 大端字节序，地址低位存储值的高位，地址高位存储值的低位。有时也称之为网络字节序 */
    public littleEndian: boolean = false
    /** 现在读取的偏移位 */
    public pos: number = 0
    /** 文件引用的原始数据(因为js特性, 会比实际数据长) */
    public buffer!: ArrayBuffer;
    /** buffer的长度 */
    public bufferLength: number = 0
    /** DataView */
    public view!: DataView;
    /** Uint8Array */
    public u8!: Uint8Array;
    /** 是否可以伸缩 */
    public expand: boolean = true
    /** 扩展按最小需求进行扩展 */
    public expandMin: boolean = false

    /**
     * 初始化
     * @param buffer 
     * @param littleEndian 默认BIG_ENDIAN
     * @param canExpand 是否可以写入时增大
     */
    public constructor(buffer?: ArrayBuffer | null | undefined, littleEndian: boolean = false, canExpand: boolean = true) {
        if (!buffer) buffer = new ArrayBuffer(GByteStream.CREAT_LEN)
        this.init(buffer)
        this.littleEndian = littleEndian
        this.expand = canExpand
    }

    /**
     * 设置这个对象的 buffer
     * @param buffer 
     */
    public init(buffer: ArrayBuffer): void {
        this.buffer = buffer
        this.bufferLength = buffer.byteLength
        this.view = new DataView(buffer)
        this.u8 = new Uint8Array(buffer)
    }

    /**
     * 写入前检测空间是否够, 不够创建新二进制(长度为翻倍), 把老内容复制进去
     * @param addLen 
     */
    public checkCapacity(addLen: number): void {
        const available = this.bufferLength - this.pos;
        if (this.expand && available < addLen) {
            let newLen: number = this.bufferLength
            const requestedLen: number = this.pos + addLen
            if (this.expandMin) {
                newLen = requestedLen
            } else {
                newLen = requestedLen + GByteStream.EXPAND_LEN
            }
            const newData = new Uint8Array(newLen)
            newData.set(this.u8)
            this.init(newData)
        }
    }

    /** Int8 : -128 到 127 */
    public rInt8(): number {
        const o: number = this.view.getInt8(this.pos)
        this.pos += 1;
        return o;
    }
    /** Int8 : -128 到 127 */
    public wInt8(n: number): void {
        this.checkCapacity(1);
        this.view.setInt8(this.pos, n)
        this.pos += 1;
    }
    /** Int16 : -32768 到 32767 */
    public rInt16(): number {
        const o: number = this.view.getInt16(this.pos, this.littleEndian)
        this.pos += 2;
        return o;
    }
    /** Int16 : -32768 到 32767 */
    public wInt16(n: number): void {
        this.checkCapacity(2);
        this.view.setInt16(this.pos, n, this.littleEndian)
        this.pos += 2;
    }
    /** Int32 : -2147483648 到 2147483647 */
    public rInt32(): number {
        const o: number = this.view.getInt32(this.pos, this.littleEndian)
        this.pos += 4;
        return o;
    }
    /** Int32 : -2147483648 到 2147483647 */
    public wInt32(n: number): void {
        this.checkCapacity(4);
        this.view.setInt32(this.pos, n, this.littleEndian)
        this.pos += 4;
    }
    /** Int64 : -9223372036854775808 到 9223372036854775807 */
    public rInt64(): number {
        throw new Error('没空写')
    }
    /** Int64 : -9223372036854775808 到 9223372036854775807 */
    public wInt64(n: number): void {
        throw new Error('没空写')
    }
    /** Uint8 : 0-255 */
    public rUint8(): number {
        const o: number = this.view.getUint8(this.pos)
        this.pos += 1;
        return o;
    }
    /** Uint8 : 0-255 */
    public wUint8(n: number): void {
        this.checkCapacity(1);
        this.view.setUint8(this.pos, n)
        this.pos += 1;
    }
    /** Uint16 : 0-65535 */
    public rUint16(): number {
        const o: number = this.view.getUint16(this.pos, this.littleEndian)
        this.pos += 2;
        return o;
    }
    /** Uint16 : 0-65535 */
    public wUint16(n: number): void {
        this.checkCapacity(2);
        this.view.setUint16(this.pos, n, this.littleEndian)
        this.pos += 2;
    }
    /** Uint32 : 0-4294967295 */
    public rUint32(): number {
        const o: number = this.view.getUint32(this.pos, this.littleEndian)
        this.pos += 4;
        return o;
    }
    /** Uint32 : 0-4294967295 */
    public wUint32(n: number): void {
        this.checkCapacity(4);
        this.view.setUint32(this.pos, n, this.littleEndian)
        this.pos += 4;
    }
    /** Uint64 : 0 到 18446744073709551615 */
    public rUint64(): number {
        var part1: number = this.rUint32(),
            part2: number = this.rUint32();
        if (this.littleEndian) {
            part2 *= 0x100000000;
        } else {
            part1 *= 0x100000000;
        }
        return part1 + part2
    }
    /** Uint64 : 0 到 18446744073709551615 */
    public wUint64(n: number): void {
        this.checkCapacity(8);
        if (this.littleEndian) {
            this.wUint32(n & 0xffffffff);
            this.wUint32(Math.floor(n / 0x100000000));
        } else {
            this.wUint32(Math.floor(n / 0x100000000));
            this.wUint32(n & 0xffffffff);
        }
    }
    /** Float32 : 单精度（32 位）浮点数 */
    public rFloat32(): number {
        const o: number = this.view.getFloat32(this.pos, this.littleEndian)
        this.pos += 4;
        return o;
    }
    /** Float32 : 单精度（32 位）浮点数 */
    public wFloat32(n: number): void {
        this.checkCapacity(4);
        this.view.setFloat32(this.pos, n, this.littleEndian)
        this.pos += 4;
    }
    /** Float64 : 双精度（64 位）浮点数 */
    public rFloat64(): number {
        const o: number = this.view.getFloat64(this.pos, this.littleEndian)
        this.pos += 8;
        return o;
    }
    /** Float64 : 双精度（64 位）浮点数 */
    public wFloat64(n: number): void {
        this.checkCapacity(8);
        this.view.setFloat64(this.pos, n, this.littleEndian)
        this.pos += 8;
    }

    /** 自动判断长度, 写入合适的数字, 第一位Unit8,中 252:Unit8, 253:Unit16, 254:Unit32, 255:Unit64 */
    public rUint(): number {
        let n: number = this.rUint8()
        if (n === 252) {
            n = this.rUint8()
        } else if (n === 253) {
            n = this.rUint16()
        } else if (n === 254) {
            n = this.rUint32()
        } else if (n === 255) {
            throw new Error('会出问题, 没空写')
            n = this.rUint64()
        }
        return n
    }
    /** 根据值自动写入到二进制 */
    public wUint(n: number): void {
        if (n < 253) {
            this.wUint8(n)
        } else if (n < 256) {
            this.wUint8(252)
            this.wUint8(n)
        } else if (n < 65536) {
            this.wUint8(253)
            this.wUint16(n)
        } else if (n < 4294967296) {
            this.wUint8(254)
            this.wUint32(n)
        } else {
            throw new Error('会出问题, 没空写')
            this.wUint8(255)
            this.wUint64(n)
        }
    }

    /** 读取二进制, 返回一个 ArrayBuffer */
    public rByte(len: number): ArrayBuffer | null {
        if (len < 1) {
            return null
        } else {
            var o: ArrayBuffer = this.buffer.slice(this.pos, this.pos + len)
            this.pos += len
            return o
        }
    }
    /** 写入一段二进制 */
    public wByte(byte: Uint8Array): void {
        if (byte.length > 0) {
            this.checkCapacity(byte.length)
            this.u8.set(byte, this.pos)
            this.pos += byte.length
        }
    }
    /** 从现在位置一直读取到末尾 */
    public rByteEnd(): ArrayBuffer | null {
        return this.rByte(this.bufferLength - this.pos)
    }
    /** 获取从0开始到现在位置Pos */
    public rBytePos(): ArrayBuffer | null {
        return this.pos > 0 ? this.buffer.slice(0, this.pos) : null
    }

    /** 自动读取长度, 并获取后面的内容, 第一位Unit8,中 252:Unit8, 253:Unit16, 254:Unit32, 255:Unit64 */
    public rByteAuto(): ArrayBuffer | null {
        let len: number = this.rUint()
        return this.rByte(len)
    }
    /** 自动判断长度, 并写入长度值 */
    public wByteAuto(byte: Uint8Array): void {
        this.wUint(byte.byteLength)
        this.wByte(byte)
    }
    
    /** 通过 textDecoder 获取字符串 */
    public rString(): string {
        const byte: ArrayBuffer | null = this.rByteAuto()
        return byte ? textDecoder.decode(new Uint8Array(byte)) : ''
    }

    /** 通过 textDecoder 设置字符串 */
    public wString(s: string): void {
        if (s.length > 0) {
            const u8: Uint8Array = textEncoder.encode(s)
            this.wByteAuto(u8)
        } else {
            this.wByteAuto(new Uint8Array(0))
        }
    }

    /** 通过 UTF-8 获取字符串 */
    public rUTF(): string {
        const byte: ArrayBuffer | null = this.rByteAuto()
        return byte ? GByteStream.wUFTByte(new Uint8Array(byte)) : ''
    }
    /** 设置 UTF-8 字符串 */
    public wUTF(s: string): void {
        const a: ArrayBuffer | null = GByteStream.rUFTByte(s)
        if (a) {
            this.wByteAuto(new Uint8Array(a))
        } else {
            this.wByteAuto(new Uint8Array(0))
        }
    }

    /** 裁切到现在操作位置 */
    public cutToPos(): void {
        if (this.pos < this.bufferLength) {
            const newByte: ArrayBuffer | null = this.rBytePos()
            if (newByte) {
                this.init(newByte)
            } else {
                this.init(new ArrayBuffer(0))
            }
        }
    }

    /**
     * 通过字符串获取 UTF-8 编码的二进制对象, 如果为空就返回null
     * @param s 字符串
     */
    public static rUFTByte(s: string): ArrayBuffer | null {
        if (s.length < 1) return null
        let byte: ArrayBuffer = new ArrayBuffer(s.length * 4)
        let u8: Uint8Array = new Uint8Array(byte)
        let view: DataView = new DataView(byte)
        let pos: number = 0
        for (let i: number = 0, l: number = s.length; i < l; i++) {
            let c: number = s.charCodeAt(i);
            if (c <= 0x7F) {
                view.setInt8(pos, c)
                pos += 1
            } else if (c <= 0x7FF) {
                u8.set([0xC0 | (c >> 6), 0x80 | (c & 0x3F)], pos)
                pos += 2
            } else if (c >= 0xD800 && c <= 0xDBFF) {
                i++
                const c2 = s.charCodeAt(i)
                if (!Number.isNaN(c2) && c2 >= 0xDC00 && c2 <= 0xDFFF) {
                    const _p1 = (c & 0x3FF) + 0x40
                    const _p2 = c2 & 0x3FF

                    const _b1 = 0xF0 | ((_p1 >> 8) & 0x3F)
                    const _b2 = 0x80 | ((_p1 >> 2) & 0x3F)
                    const _b3 = 0x80 | ((_p1 & 0x3) << 4) | ((_p2 >> 6) & 0xF)
                    const _b4 = 0x80 | (_p2 & 0x3F)

                    u8.set([_b1, _b2, _b3, _b4], pos)
                    pos += 4
                }
            } else if (c <= 0xFFFF) {
                u8.set([0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F)], pos)
                pos += 3
            } else {
                u8.set([0xF0 | (c >> 18), 0x80 | ((c >> 12) & 0x3F), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F)], pos)
                pos += 4
            }
        }
        return pos > 0 ? byte.slice(0, pos) : null
    }

    /**
     * 从 UTF-8 中获取字符串
     * @param u UTF-8 的二进制
     */
    public static wUFTByte(u: Uint8Array): string {
        if (u.byteLength < 1) return ''
        let pos: number = 0
        const len: number = u.byteLength
        var c: number, c2: number, c3: number;
        var strs: string[] = [];
        while (pos < len) {
            c = u[pos++]
            if (c < 0x80) {
                if (c != 0) strs.push(String.fromCharCode(c))
            } else if (c < 0xE0) {
                strs.push(String.fromCharCode(((c & 0x3F) << 6) | (u[pos++] & 0x7F)))
            } else if (c < 0xF0) {
                c2 = u[pos++];
                strs.push(String.fromCharCode(((c & 0x1F) << 12) | ((c2 & 0x7F) << 6) | (u[pos++] & 0x7F)))
            } else {
                c2 = u[pos++];
                c3 = u[pos++];
                const _code = ((c & 0x0F) << 18) | ((c2 & 0x7F) << 12) | ((c3 & 0x7F) << 6) | (u[pos++] & 0x7F);
                if (_code >= 0x10000) {
                    const _offset = _code - 0x10000;
                    const _lead = 0xd800 | (_offset >> 10);
                    const _trail = 0xdc00 | (_offset & 0x3ff);
                    strs.push(String.fromCharCode(_lead))
                    strs.push(String.fromCharCode(_trail))
                }
                else {
                    strs.push(String.fromCharCode(_code))
                }
            }
        }
        return strs.join('')
    }
}