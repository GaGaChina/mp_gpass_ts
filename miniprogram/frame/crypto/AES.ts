import { EncodingText } from "../../lib/text-encoding/EncodingText";
import { $g } from "../speed.do";
import { ToolBytes } from "../tools/tool.bytes";
import { SHA256 } from "./SHA256";

var CryptoJS = require('./../../lib/crypto-js/crypto-js')

/**
 * 长度16/24/32字节,不够末尾追加特定字符或重复密码字符串,直到最小长度
 */
export class AES {

    /** 设置加密key */
    private key: any = null

    private getBuffer(data: ArrayBuffer | Uint8Array | string): ArrayBuffer {
        const v: any = data
        let b: ArrayBuffer;
        if ($g.isString(data)) {
            const u8: Uint8Array = EncodingText.encode(v)
            b = u8.buffer
        } else if ($g.isTypeM(data, 'ArrayBuffer')) {
            b = v
        } else {
            // Uint8Array
            b = v.buffer
        }
        return b
    }

    /**
     * 使用 key 的 SHA256 进行设置 key 32字节 → AES256
     * ArrayBuffer : 直接设置
     * Uint8Array : 取出 ArrayBuffer 进行设置
     * string : EncodingText.encode 转二进制设置
     * @param key 
     */
    public async setKey(key: ArrayBuffer | Uint8Array | string): Promise<void> {
        let byte: ArrayBuffer = this.getBuffer(key);
        byte = await SHA256.sha256(byte)
        this.key = CryptoJS.lib.WordArray.create(byte)
        return Promise.resolve();
    }

    /**
     * 加密
     * 向量加密解密过程中不变
     * @param data 二进制正常走, 如果是字符串(将 EncodingText → Byte)
     * @param iv 16位向量, 字符串(将 EncodingText → Byte → SHA256 → 16位)
     */
    public async encryptCBC(data: ArrayBuffer | Uint8Array | string, iv: ArrayBuffer | string | null | undefined = null): Promise<ArrayBuffer | null> {
        if (iv === null || iv === undefined) iv = new ArrayBuffer(16)
        let byte: ArrayBuffer = this.getBuffer(data);
        // 处理 iv 为字符串
        const v: any = iv
        if ($g.isString(iv)) {
            const vU8: Uint8Array = EncodingText.encode(v)
            const vSHA: ArrayBuffer = await SHA256.sha256(vU8.buffer)
            iv = vSHA.slice(0, 16)
        }
        const wordIn = CryptoJS.lib.WordArray.create(byte)
        const wordIV = CryptoJS.lib.WordArray.create(iv)
        // $g.log('[CryptoJS][Aes]加密 wordIn:', wordIn);
        // $g.log('[CryptoJS][Aes]加密 wordIV:', wordIV);
        const wordOut = CryptoJS.AES.encrypt(wordIn, this.key, {
            iv: wordIV,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        })
        // $g.log('[CryptoJS][Aes]加密 wordOut:', wordOut);
        if (wordOut && wordOut.ciphertext) {
            const outWord = ToolBytes.CryptJsWordArrayToUint8Array(wordOut.ciphertext)
            if (outWord) {
                return outWord.buffer
            }
        }
        return null
    }

    /**
     * 解密, 对加密过的 ArrayBuffer | Uint8Array 进行解密
     * 向量加密解密过程中不变
     * @param data 
     * @param iv 16位向量, 字符串(将 EncodingText → Byte → SHA256 → 16位), 空 → 全0的16位
     */
    public async decryptCBC(data: ArrayBuffer | Uint8Array, iv: ArrayBuffer | string | null | undefined = null): Promise<ArrayBuffer | null> {
        if (iv === null || iv === undefined) iv = new ArrayBuffer(16)
        let byte: ArrayBuffer = this.getBuffer(data);
        // 处理 iv 为字符串
        const v: any = iv
        if ($g.isString(iv)) {
            const vU8: Uint8Array = EncodingText.encode(v)
            const vSHA: ArrayBuffer = await SHA256.sha256(vU8.buffer)
            iv = vSHA.slice(0, 16)
        }
        const wordData = CryptoJS.lib.WordArray.create(byte)
        const ciphertext = CryptoJS.lib.CipherParams.create({ ciphertext: wordData })
        const wordIV = CryptoJS.lib.WordArray.create(iv)
        // $g.log('[CryptoJS][Aes]解密 wordData:',wordData);
        // $g.log('[CryptoJS][Aes]解密 ciphertext:', ciphertext);
        // $g.log('[CryptoJS][Aes]解密 wordIV:', wordIV);
        const wordOut: any = CryptoJS.AES.decrypt(ciphertext, this.key, {
            iv: wordIV,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        })
        // $g.log('[CryptoJS][Aes]解密 wordOut:', wordOut)
        const outWord: Uint8Array | null = ToolBytes.CryptJsWordArrayToUint8Array(wordOut)
        if (outWord) {
            return outWord.buffer
        }
        return null
    }

    /** 测试代码 */
    // public static async test(): Promise<void> {
    //     $g.log('[AES][测试模块]----------------------------------')
    //     // 设置key
    //     await AES.setKey('Iam is key')
    //     // 加密内容
    //     let aseStr: string = '1234567890abcdefg'
    //     let aesEnc: any = await AES.encryptCBC(aseStr, '我是IV')
    //     let aesDec: any = await AES.decryptCBC(aesEnc, '我是IV')
    //     let aesOut: string = EncodingText.decode(aesDec)
    //     $g.log('[AES][加密字符]', aseStr)
    //     $g.log('[AES][解密结果]', aesOut)
    //     $g.log('[AES][加密后]', aesEnc)
    //     $g.log('[AES][解密后]', aesDec)
    //     $g.log('[AES][测试模块]二进制封装')
    //     aseStr = '大家好, 这个是测试字符串的'
    //     let aesByteIn:GByteStream = new GByteStream()
    //     aesByteIn.wString(aseStr)
    //     aesByteIn.cutToPos()
    //     aesEnc = await AES.encryptCBC(aesByteIn.buffer, '111')
    //     aesDec = await AES.decryptCBC(aesEnc, '111')
    //     let aesByteOut:GByteStream = new GByteStream(aesDec)
    //     aesOut = aesByteOut.rString()
    //     $g.log('[AES][加密字符]', aseStr)
    //     $g.log('[AES][解密结果]', aesOut)
    //     $g.log('[AES][加密后]', aesEnc)
    //     $g.log('[AES][解密后]', aesDec)
    //     $g.log('[AES][加密Byte]', aesByteIn.buffer)
    //     $g.log('[AES][解密Byte]', aesDec)
    // }
}