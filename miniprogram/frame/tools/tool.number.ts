import { $g } from "../speed.do"

export class ToolNumber {

    // 返回浮点 [0-1) 的随机数, 不包含1
    public static randomFloat(): number {
        //const int = window.crypto.getRandomValues(new Uint32Array(1))[0]
        //return int / 2**32
        return Math.random()
    }

    /**
     * 返回整型随机数, 返回在[min, max)之间
     * @param min 最小值
     * @param max 最大值
     */
    public static randomInt(min: number, max: number): number {
        const range = max - min
        return Math.floor(ToolNumber.randomFloat() * range + min)

        // if (crypto) {
        //     // Use getRandomValues method (Browser)
        //     if (typeof crypto.getRandomValues === 'function') {
        //         try {
        //             return crypto.getRandomValues(new Uint32Array(1))[0];
        //         } catch (err) {}
        //     }

        //     // Use randomBytes method (NodeJS)
        //     if (typeof crypto.randomBytes === 'function') {
        //         try {
        //             return crypto.randomBytes(4).readInt32LE();
        //         } catch (err) {}
        //     }
        // }
    }

    /**
     * 创建一个整型返回为 [min, max) 的数组
     * @param length 数组长度
     * @param min 最小值(包含)
     * @param max 最大值(不包含)
     */
    public static randomIntArray(length: number, min: number, max: number): number[] {
        return new Array(length).fill(0).map(() => ToolNumber.randomInt(min, max))
    }

    /**
     * 替代 getRandomValues
     * @param length 最大长度
     */
    public static randomBytes(length: number) {
        const out: Uint8Array = new Uint8Array(length)
        for (let i = 0; i < length; i++) {
            out[i] = ToolNumber.randomInt(0, 256)
        }
        return out;
    }

    /**
     * 替代 getRandomValues
     * @param typedArray 
     */
    public static getRandomValues(typedArray: any) {
        const type: string = $g.typeM(typedArray)
        let min: number = 0
        let max: number = 0
        switch (type) {
            case 'Int8Array':
                min = -128
                max = 127
                break;
            case 'Uint8Array':
                max = 255
                break;
            case 'Uint8ClampedArray':
                max = 255
                break;
            case 'Int16Array':
                min = -32768
                max = 32767
                break;
            case 'Uint16Array':
                max = 65535
                break;
            case 'Int32Array':
                min = -2147483648
                max = 2147483647
                break;
            case 'Uint32Array':
                max = 4294967295
                break;
            case 'Float32Array':
                min = 1.2 * 10 ** -38
                max = 3.4 * 10 ** 38
                break;
            case 'Float64Array':
                min = 5 * 10 ** -324
                max = 1.8 * 10 ** 308
                break;
            case 'BigInt64Array':
                min = 2 ** -63
                max = 2 ** 63 - 1
                break;
            case 'BigUint64Array':
                max = 2 ** 64 - 1
                break;
            default:
                console.log(`获取类型缺失 : ${type}`);
        }
        max = max + 1
        for (let i = 0; i < typedArray.length; i++) {
            typedArray[i] = ToolNumber.randomInt(min, max)
        }
    }
}