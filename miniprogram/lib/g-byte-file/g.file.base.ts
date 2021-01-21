import { GByteStream } from "./g.byte.stream";

export class GFileConfig {

    /** 文件头ID : GFileHead */
    public static readonly TYPE_000_HEAD: number = 0

    /** 文件头ID : GFileLog */
    public static readonly TYPE_001_LOG: number = 1

    /** 文件头ID : GFileBase */
    public static readonly TYPE_254_BASE: number = 254

}

/** 基础接口 */
export interface IGFileBase {
    /** 文件信息 → 二进制 **/
    getHeadByte(): GByteStream;
    /** 文件信息 ← 二进制 **/
    setHeadByte(b: GByteStream): void;
}

/** 文件的基类, 不能初始化使用 */
export abstract class GFileBase implements IGFileBase {

    /** 文件的类型 */
    public type: number = GFileConfig.TYPE_254_BASE
    /** 文件的名称(不含扩展名) */
    public name: string = ''
    /** 文件路径, 使用 / 分割 */
    public path: string = ''
    /** 包体内容原始长度(解压后) */
    public lenSource: number = 0
    /** 文件系统的长度 */
    public lenHead: number = 0
    /** 包体内容的长度 */
    public lenBody: number = 0
    /** 包体读入后的压缩类型 */
    public compress: number = 0

    /** 强引用对象 **/
    public obj: any;
    /** 记录谁在使用本对象[弱引用], 如果空了(但无法知道是否为空), 就可以清理 obj **/
    public objLink?: WeakMap<any, any>;


    /** 弱引用对象 */
    //public objWeak?: WeakRef;
    // objWeak = new WeakRef(弱引用对象)
    // const deref = objWeak.deref();
    // if(deref)

    /** 文件管理类, 列表类 */
    public parent: any = null

    /** 文件信息 → 二进制 **/
    public getHeadByte(): GByteStream {
        let b: GByteStream = new GByteStream(null)
        b.wUint8(this.type)
        b.wString(this.path)
        b.wUint32(this.lenSource)
        b.wUint32(this.lenHead)
        b.wUint32(this.lenBody)
        b.wUint8(this.compress)
        b.cutToPos()
        return b;
    }

    /** 文件信息 ← 二进制 **/
    public setHeadByte(b: GByteStream): void {
        this.type = b.rUint8()
        this.path = b.rString()
        const pathArr: string[] = this.path.split('/')
        if (pathArr && pathArr.length > 0) this.name = pathArr[pathArr.length - 1]
        const nameArr: string[] = this.name.split('.')
        if (nameArr) {
            if (nameArr.length > 0) this.name = pathArr[0]
            if (nameArr.length > 1) {
                pathArr[pathArr.length - 1]
            }
        }
        this.lenSource = b.rUint32()
        this.lenHead = b.rUint32()
        this.lenBody = b.rUint32()
        this.compress = b.rUint8()
    }

    /** 文件内容 ← 二进制 **/
    public setBodyByte(b: GByteStream): any {
        const body: ArrayBuffer | null = b.rByte(this.lenBody)
        return null
    }

    /** 文件内容 → 二进制 **/
    public getBodyByte(): GByteStream {
        return new GByteStream(new ArrayBuffer(0));
    }

    /**
     * [合并包头包体的]从这个对象里获取二进制数据
     */
    public getByte(): GByteStream {
        const head: GByteStream = this.getHeadByte()
        const body: GByteStream = this.getBodyByte()
        const out: GByteStream = new GByteStream(new ArrayBuffer(0))
        out.expandMin = true
        out.wByteAuto(head.u8)
        out.wByteAuto(body.u8)
        return out;
    }

    /**
     * [合并包头包体的]通过设置这个对象的二进制,设置这个对象的信息
     * @param byte
     */
    public setByte(b: GByteStream): any {
        const head: ArrayBuffer | null = b.rByteAuto()
        const body: ArrayBuffer | null = b.rByteAuto()
        // switch (this.compress) 
        // {
        // 	case 1://1.zlib:默认
        // 		body.uncompress();
        // 		break;
        // 	case 2://2.deflate:压缩(尽量别用)
        // 		body.uncompress("deflate");
        // 		break;
        // 	case 3://3.lzma也就是7z
        // 		body.uncompress("lzma");
        // 		break;
        // }
        if (head) this.setHeadByte(new GByteStream(head))
        if (body) this.setBodyByte(new GByteStream(body))

        return new GByteStream(new ArrayBuffer(100));
    }

    /**
     * 获取文件内的对象
     * @param link [弱引用]谁在引用这个对象
     */
    public getObj(link?: any | null | undefined): any {

    }

    /**
     * 释放某一个引用
     * @param link 
     */
    public unLink(link?: any | null | undefined): void {

    }

    /**
     * 查看有多少引用, 如果少就释放
     */
    public clearObj(): void {

    }
}



/** 文件的基类, 不能初始化使用 */
export abstract class GFile {

    /** 文件的路径 */
    public path: string = ''
    /** 文件版本号 */
    public ver: number = 0
    /** 文件的MD5编码 */
    public md5: string = ''
    /** 文件所占用的块区域 */
    public block: Array<GBlock> = new Array<GBlock>()
    /** 配置信息 */
    public config: number = 0

    /** 时间开关 */
    private static CONFIG_TIME: number = 0b00000010

    /** 是否启用时间 */
    public get configTime(): boolean {
        return (this.config & GFile.CONFIG_TIME) ? true : false
    }
    /** 是否启用时间 */
    public set configTime(v: boolean) {
        if (v) {
            this.config = this.config | GFile.CONFIG_TIME
        } else {
            this.config = this.config & ~GFile.CONFIG_TIME
        }
    }



}

/**
 * 表示存储的一块区域
 */
export class GBlock extends GFileBase {

    /** 二进制头的ID号 */
    public static readonly HEAD_ID: number = 2

    /** 文件的索引 */
    public file: number = 0
    /** 文件的开始位置 */
    public start: number = 0
    /** 文件的长度 */
    public length: number = 0

    /** 文件信息 → 二进制 **/
    public getHeadByte(): GByteStream {
        let b: GByteStream = new GByteStream(new ArrayBuffer(11))
        b.wUint8(GBlock.HEAD_ID)
        b.wUint16(this.file)
        b.wUint32(this.start)
        b.wUint32(this.length)
        b.cutToPos()
        return b;
    }

    /** 文件信息 ← 二进制 **/
    public setHeadByte(b: GByteStream): void {
        this.type = b.rUint8()
        this.file = b.rUint16()
        this.start = b.rUint32()
        this.length = b.rUint32()
    }
}