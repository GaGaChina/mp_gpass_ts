import { $g } from "../speed.do"
import { ToolString } from "./tool.string";


export class ToolBytes {

    /* 将一个 CryptJS WordArray 转换为 Uint8Array */
    public static CryptJsWordArrayToUint8Array(wordArray: any): Uint8Array | null {
        if (!(wordArray)) return null;
        if (!(wordArray.words && wordArray.words.length !== 0)) return null
        let l: number = wordArray.sigBytes
        if (l < 0) l = wordArray.words.length * 4
        const words = wordArray.words
        const result = new Uint8Array(l)
        // dst
        var i: number = 0
        // src
        var j: number = 0
        while (true) {
            // here i is a multiple of 4
            // 0xff == 1111 1111 flags & mask; // 1&1=1 1&0=0 当前设置不同的全部关闭
            if (i === l) break;
            var w = words[j++];
            result[i++] = (w & 0xff000000) >>> 24;// 只留下ff位的内容
            if (i === l) break;
            result[i++] = (w & 0x00ff0000) >>> 16;
            if (i === l) break;
            result[i++] = (w & 0x0000ff00) >>> 8;
            if (i === l) break;
            result[i++] = (w & 0x000000ff);
        }
        // $g.log('[ToolBytes]CryptJsWordArrayToUint8Array ok')
        return result;
    }

    /**
     * 将 ArrayBuffer 对象转成 Base64 字符串
     * @param buffer ArrayBuffer
     */
    public static ArrayBufferToBase64(buffer: ArrayBuffer): string {
        // wx.arrayBufferToBase64 2.4.0 以后就废弃了
        // return wx.arrayBufferToBase64(buffer)
        // 参考 KdbxApi.kdbxweb.ByteUtils.bytesToBase64(buffer)
        const u8: Uint8Array = new Uint8Array(buffer)
        let str = '';
        for (var i = 0; i < u8.length; i++) {
            str += String.fromCharCode(u8[i]);
        }
        return ToolString.btoa(str);
    }

    /**
     * 将 Base64 字符串转成 ArrayBuffer 对象
     * @param buffer ArrayBuffer
     */
    public static Base64ToArrayBuffer(base64: string): ArrayBuffer {
        // return wx.base64ToArrayBuffer(base64)
        // 参考 KdbxApi.kdbxweb.ByteUtils.base64ToBytes(base64)
        var byteStr = ToolString.atob(base64);
        var arr = new Uint8Array(byteStr.length);
        for (var i = 0; i < byteStr.length; i++) {
            arr[i] = byteStr.charCodeAt(i);
        }
        return arr.buffer;
    }

    /** 二进制转Hex */
    public static byteToHex(u8: Uint8Array): string {
        let str: string = ''
        for (let i = 0; i < u8.length; i++) {
            const byte: string = u8[i].toString(16)
            if (byte.length === 1) str += '0'
            str += byte
        }
        return str;
    }
}