import { ToolBytes } from "../../frame/tools/tool.bytes";

const pako = require('./../pako/index')
const BinaryStream = require('./../kdbxweb/utils/binary-stream.js')
const base64 = require('./encoding-base64.js')
//const base64Old = require('./../text-encoding/lib/encoding-indexes.js')["encoding-indexes"]

export class EncodingIndexes {

    private static isInit: boolean = false;

    public static init(o: Object) {
        if (this.isInit) return;
        console.log('TextEncodingIndexes 解压');
        const handleArrayList: [][] = EncodingIndexes.setArray(o)
        let handleArray: any = handleArrayList[0]
        let handleIndex: number = 0
        const gzip = ToolBytes.Base64ToArrayBuffer(base64)
        const byteU8: Uint8Array = pako.ungzip(gzip)
        const byteLength: number = byteU8.length
        const stream = new BinaryStream(byteU8.buffer)
        // 操作类型编码
        let typeInfo: number, temp_n1: number, temp_n2: number, temp_n3: number, temp_s: string
        while (stream.pos < byteLength) {
            typeInfo = stream.getUint8()
            if (typeInfo === 0) {
                handleIndex++
                handleArray = handleArrayList[handleIndex]
            } else if (typeInfo > 0 && typeInfo < 17) {
                temp_n2 = typeInfo < 11 ? stream.getUint8() : stream.getUint16();
                if (typeInfo === 1 || typeInfo === 11) {
                    temp_s = 'Uint8'
                } else if (typeInfo === 2 || typeInfo === 12) {
                    temp_s = 'Uint16'
                } else if (typeInfo === 3 || typeInfo === 13) {
                    temp_s = 'Uint32'
                } else if (typeInfo === 4 || typeInfo === 14) {
                    temp_s = 'Int8'
                } else if (typeInfo === 5 || typeInfo === 15) {
                    temp_s = 'Int16'
                } else {//} else if (typeInfo === 6 || typeInfo === 16) {
                    temp_s = 'Int32'
                }
                while (--temp_n2 > -1) {
                    temp_n1 = stream['get' + temp_s]()
                    handleArray.push(temp_n1)
                }
            } else if (typeInfo > 99 && typeInfo < 104) {
                // 重复 数字 次数
                temp_n1 = (typeInfo === 100 || typeInfo === 102) ? stream.getUint8() : stream.getUint16();
                temp_n2 = typeInfo < 102 ? stream.getUint8() : stream.getUint16();
                while (--temp_n2 > -1) {
                    handleArray.push(temp_n1)
                }
            } else if (typeInfo > 109 && typeInfo < 113) {
                // 从 起数 +1 递增 排到 结束数
                temp_s = typeInfo === 110 ? '8' : typeInfo === 111 ? '16' : '32'
                temp_n1 = stream['getUint' + temp_s]()
                temp_n2 = stream['getUint' + temp_s]()
                while (temp_n1 <= temp_n2) {
                    handleArray.push(temp_n1)
                    temp_n1++
                }
            } else if (typeInfo > 139 && typeInfo < 168) {
                if (typeInfo > 159) {
                    temp_s = '32'
                    typeInfo -= 20
                } else if (typeInfo > 149) {
                    temp_s = '16'
                    typeInfo -= 10
                } else {
                    temp_s = '8'
                }
                if (typeInfo < 142 || typeInfo === 144 || typeInfo === 145) {
                    temp_n3 = stream.getUint8()
                } else {
                    temp_n3 = stream.getUint16()
                }
                temp_n1 = stream['getUint' + temp_s]()
                if (typeInfo === 140 || typeInfo === 142) {
                    temp_n2 = stream.getInt8()
                } else if (typeInfo === 141 || typeInfo === 143) {
                    temp_n2 = stream.getUint8()
                } else if (typeInfo === 144 || typeInfo === 146) {
                    temp_n2 = stream.getInt16()
                } else {
                    temp_n2 = stream.getUint16()
                }
                while (--temp_n3 > -1) {
                    handleArray.push(temp_n1)
                    temp_n1 += temp_n2
                }
            } else if (typeInfo === 250) {
                handleArray.push(null)
            } else if (typeInfo > 250 && typeInfo < 253) {
                temp_n2 = typeInfo === 251 ? stream.getUint8() : stream.getUint16();
                while (--temp_n2 > -1) {
                    handleArray.push(null)
                }
            } else {
                console.log('失败, 缺:', typeInfo);
                return;
            }
        }
        EncodingIndexes.changeGB18030(o)
        EncodingIndexes.isInit = true
        //this.check(o, base64Old)
    }

    /**
     * 处理里面的特殊数组
     * @param o 
     */
    private static changeGB18030(o: any) {
        const run: number[] = o['gb18030-ranges']
        const newArr: any = []
        let i: number = 0,
            len: number = run.length,
            a: number[]
        while (i < len) {
            a = []
            a.push(run[i++])
            a.push(run[i++])
            newArr.push(a)
        }
        o['gb18030-ranges'] = newArr
    }

    // private static check(o1: any, o2: any) {
    //     for (const key in o2) {
    //         if (o1.hasOwnProperty(key)) {
    //             let a1 = o1[key]
    //             let a2 = o2[key]
    //             for (let i = 0; i < a2.length; i++) {
    //                 if (Object.prototype.toString.call(a1[i]) === '[object Array]') {
    //                     if (a1[i][0] !== a2[i][0] || a1[i][1] !== a2[i][1]) {
    //                         console.log('节点 key:' + key + '无法对应序号 : ' + i + ' 值 : ', a1[i], ' 需要值', a2[i]);
    //                         console.log(a1)
    //                         console.log(a2)
    //                         return
    //                     }
    //                 } else {
    //                     if (a1[i] !== a2[i]) {
    //                         console.log('节点 key:' + key + '无法对应序号 : ' + i + ' 值 : ', a1[i], ' 需要值', a2[i]);
    //                         console.log(a1)
    //                         console.log(a2)
    //                         return
    //                     }
    //                 }
    //             }
    //         } else {
    //             console.log('缺少Key : ' + key, o1)
    //             return
    //         }
    //     }
    //     console.log('-------------------校验完成--------------------');
    // }

    private static setArray(o: any): [][] {
        const a: [][] = []
        const s: string = 'big5,euc-kr,gb18030,gb18030-ranges,jis0208,jis0212,ibm866,iso-8859-2,iso-8859-3,iso-8859-4,iso-8859-5,iso-8859-6,iso-8859-7,iso-8859-8,iso-8859-10,iso-8859-13,iso-8859-14,iso-8859-15,iso-8859-16,koi8-r,koi8-u,macintosh,windows-874,windows-1250,windows-1251,windows-1252,windows-1253,windows-1254,windows-1255,windows-1256,windows-1257,windows-1258,x-mac-cyrillic'
        let t: string = ''
        let l: number = s.length
        for (let i = 0; i < l; i++) {
            if (s[i] === ',') {
                o[t] = []
                a.push(o[t])
                t = ''
            } else {
                t += s[i]
            }
        }
        o[t] = []
        a.push(o[t])
        return a
    }
}