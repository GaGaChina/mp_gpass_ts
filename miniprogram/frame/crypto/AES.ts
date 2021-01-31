var CryptoEngine = require('./../../lib/kdbxweb/crypto/crypto-engine')
var ByteUtils = require('./../../lib/kdbxweb/utils/byte-utils')

export class AES {

    /** 获取加密对象 */
    private static aes: any = null

    /**
     * 设置证书
     * @param key 
     */
    public static async importKey(key: ArrayBuffer): Promise<any> {
        if (AES.aes === null) AES.aes = CryptoEngine.createAesCbc();
        return await AES.aes.importKey(key)
    }

    /**
     * 使用字符串设置key
     * @param str 
     */
    public static async importKeyStr(str: String): Promise<any> {
        const byte: Uint8Array = ByteUtils.stringToBytes(str)
        const buffer: ArrayBuffer = byte.buffer
        return await AES.importKey(buffer)
    }

    /**
     * 加密
     * @param data 
     * @param iv 
     */
    public static async encrypt(data: Uint8Array | ArrayBuffer, iv: ArrayBuffer | null = null): Promise<ArrayBuffer> {
        if (AES.aes === null) AES.aes = CryptoEngine.createAesCbc();
        if (iv === null) iv = new ArrayBuffer(16)
        return await AES.aes.encrypt(data, iv)
    }

    /**
     * 解密
     * @param data 
     * @param iv 
     */
    public static async decrypt(data: Uint8Array | ArrayBuffer, iv: ArrayBuffer | null = null): Promise<ArrayBuffer> {
        if (AES.aes === null) AES.aes = CryptoEngine.createAesCbc();
        if (iv === null) iv = new ArrayBuffer(16)
        return await AES.aes.decrypt(data, iv)
    }
}