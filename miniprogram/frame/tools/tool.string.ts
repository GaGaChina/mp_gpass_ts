const crc32 = require('./../../lib/pako/zlib/crc32.js')

export class ToolString {

    /**
     * 根据ID获取类似于001, 012, 这样的序号
     * @param n 原始数字
     * @param len 最短长度
     * @param addStr 添加的字符串
     */
    public static getNumberStr(n: number, len: number = 3, addStr: string = ' '): string {
        let str: string = String(~~n);
        len = len - str.length;
        while (len-- > 0) {
            str = addStr + str;
        }
        return str;
    }

    /**
     * 对文本进行CRC32处理
     * crc32("hello").toString(16));  //3610a686
     * @param s CRC32字符串
     * @param crc 
     */
    public static CRC32_Str(s: string, crc: number = 0): number {
        let sl: number = s.length
        let u16: Uint16Array = new Uint16Array(new ArrayBuffer(sl * 2))
        for (var i: number = 0; i < sl; i++) {
            // charCodeAt() 返回指定位置字符 Unicode 编码。范围(0 - 65535)
            u16[i] = s.charCodeAt(i)
        }
        return crc32(0, u16, sl, 0)
    }

    /**
     * 将一个string进行base64编码
     * @param s 需要进行Base64的对象
     */
    public static b64Encode(s: string): string {
        return ToolString.btoa(unescape(encodeURIComponent(s)));
    }

    /**
     * 将一个进行了Base64编码对象进行解码
     * @param s 需要进行解码的Base64编码
     */
    public static b64Decode(s: string): string {
        return decodeURIComponent(escape(ToolString.atob(s)));
    }
    /** base64字符集 */
    private static readonly b64: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    /**
     * 创建 base-64 编码字符串
     * "A-Z", "a-z", "0-9", "+", "/" 和 "=" 字符编码字符串
     * @param s 需要编码的字符串
     */
    public static btoa(s: string): string {
        s = String(s);
        var bitmap, a, b, c, result = "", i = 0,
            rest = s.length % 3; // 确定最后填充
        for (; i < s.length;) {
            if ((a = s.charCodeAt(i++)) > 255 || (b = s.charCodeAt(i++)) > 255 || (c = s.charCodeAt(i++)) > 255)
                throw new TypeError("Failed to execute 'btoa' : The string to be encoded contains characters outside of the Latin1 range.");
            bitmap = (a << 16) | (b << 8) | c;
            result += ToolString.b64.charAt(bitmap >> 18 & 63) + ToolString.b64.charAt(bitmap >> 12 & 63) +
                ToolString.b64.charAt(bitmap >> 6 & 63) + ToolString.b64.charAt(bitmap & 63);
        }
        // 如果需要填充，用等号替换最后的“A”
        return rest ? result.slice(0, rest - 3) + "===".substring(rest) : result;
    }

    /**
     * 检查base64编码正则
     * [A-Za-z\d+\/]  "A-Z a-z 0-9 + /" 可以出现的字符类型
     * 
     * / 0-9 : 47 - 57 (包含)
     * a-z : 97 - 122
     * A - Z : 65 - 90
     * = : 61   + : 43
     * 
     * /^(?:[符]{4})*?(?:[符]{2}(?:==)?|[符]{3}=?)?$/
     * 符 * 4 直接输出
     * 符 * 3 后面加 '='
     * 符 * 2 后面加 '=='
     */
    //private static readonly b64re: RegExp = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;

    /**
     * 解码字符串
     * @param s 需要解码的字符串
     */
    public static atob(s: string): string {
        s = String(s)
        let l: number = s.length
        let code: number = 0
        // 是否进行 test 测试字符串是否合法
        // s = s.replace(/[\t\n\f\r ]+/g, "")编码内部处理 ' ', \n, \r, \t, \f (改造算法)
        while (--l > 0) {
            code = s.charCodeAt(l)
            // 剥离没用的字符串
            if (code === 32 || code === 10 || code === 13 || code === 9 || code === 12) {
                s = s.substr(0, l) + s.substr(l + 1)
            } else if ((code > 46 && code < 58) || (code > 96 && code < 123) || (code > 64 && code < 91) || code === 43) {
                //正常BASE64个字符
            } else if (code === 61) {
                if (l === (s.length - 1)) {
                    // 最后一位
                } else if (l === (s.length - 2) && s.charCodeAt(s.length - 1) === 61) {
                    // 倒数第二位
                } else {
                    throw new TypeError("Base64非法, = 位置非法");
                }
            } else {
                throw new TypeError("Base64非法, atob 错误 : 非法字符 : " + s.substr(l, 1));
            }
        }
        if (s.length % 4 !== 0) throw new TypeError("Base64非法, 长度非法");
        /*
        if (!ToolString.b64re.test(s))
            throw new TypeError("Failed to execute 'atob' : The string to be decoded is not correctly encoded.");
        */
        // Adding the padding if missing, for semplicity
        s += "==".slice(2 - (s.length & 3));
        var bitmap, result = "", r1, r2, i = 0;
        for (; i < s.length;) {
            bitmap = ToolString.b64.indexOf(s.charAt(i++)) << 18 | ToolString.b64.indexOf(s.charAt(i++)) << 12 |
                (r1 = ToolString.b64.indexOf(s.charAt(i++))) << 6 | (r2 = ToolString.b64.indexOf(s.charAt(i++)));
            result += r1 === 64 ? String.fromCharCode(bitmap >> 16 & 255) :
                r2 === 64 ? String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255) :
                    String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255, bitmap & 255);
        }
        return result;
    }
}