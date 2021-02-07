var CryptoEngine = require('./../../lib/kdbxweb/crypto/crypto-engine')

export class SHA256 {

    /**
     * SHA-256 hash 32byt
     * @param {ArrayBuffer} data
     * @returns {Promise.<ArrayBuffer>}
     */
    public static async sha256(data: ArrayBuffer): Promise<ArrayBuffer> {
        return await CryptoEngine.sha256(data);
    }
}