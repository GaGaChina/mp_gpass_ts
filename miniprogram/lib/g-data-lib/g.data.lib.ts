import { $g } from "../../frame/speed.do";
import { Kdbx, Times } from "../kdbxweb/types";

interface IGData {
    getInfo(): Object;
    setInfo(o: Object): void;
}

// 
/** 基类, 不能初始化使用 */
export abstract class GDataBase implements IGData {

    /**
     * this[GDataBase] → info[JSON]
     * @param info 写入JSON对象
     * @param key 操作键名或键名列表
     */
    public getProperty(info: Object, key: string | Array<string>): Object {
        const a: any = $g.isString(key) ? [key] : key
        const base: any = this
        const json: any = info
        for (let i: number = 0, l: number = a.length; i < l; i++) {
            const k: string = a[i]
            if (base[k] !== null) {
                if ($g.isArray(base[k])) {
                    if (base[k].length > 0) {
                        const res: Array<Object> = new Array<Object>()
                        json[k] = res
                        const temp = base[k][0]
                        const isBase: boolean = temp instanceof GDataBase ? true : false
                        if (isBase) json['_' + k + '_Class'] = $g.typeName(temp)
                        for (let j: number = 0, jl: number = base[k].length; j < jl; j++) {
                            if (isBase) {
                                res.push(base[k][j].getInfo())
                            } else {
                                res.push(base[k][j])
                            }
                        }
                    }
                } else if (base[k] instanceof GDataBase) {
                    json[k] = base[k].getInfo()
                    json['_' + k + '_Class'] = $g.typeName(base[k])
                } else {
                    json[k] = base[k]
                }
            }
        }
        return info
    }

    /**
     * this[GDataBase] ← info[JSON], 自动处理 GDataBase
     * @param info 读取JSON对象
     * @param key 操作键名或键名列表
     */
    public setProperty(info: Object, key: string | Array<string>): void {
        const a: any = $g.isString(key) ? [key] : key
        const base: any = this
        const json: any = info
        for (let i: number = 0, l: number = a.length; i < l; i++) {
            const k: string = a[i]
            if ($g.hasKey(info, k) && $g.hasKey(base, k)) {
                let c: { new(): GDataBase; } | null = this.getClassObject(json['_' + k + '_Class'])
                let co: GDataBase;
                if (c !== null) {
                    if ($g.isArray(base[k])) {
                        const jsonA: Array<Object> = json[k]
                        for (let i: number = 0, l: number = jsonA.length; i < l; i++) {
                            co = new c()
                            base[k].push(co)
                            co.setInfo(jsonA[i])
                        }
                    } else {
                        if (!base[k]) base[k] = new c()
                        base[k].setInfo(json[k])
                    }
                } else {
                    base[k] = json[k]
                }
            }
        }
    }

    /** 类名称 */
    private static className: Array<string> = []
    private static classTarget: Array<{ new(): GDataBase; }> = []

    private getClassObject(className: string): { new(): GDataBase; } | null {
        if (GDataBase.className.length === 0) {
            GDataBase.className.push($g.typeName(AccessLog))
            GDataBase.classTarget.push(AccessLog)
            GDataBase.className.push($g.typeName(GDataItem))
            GDataBase.classTarget.push(GDataItem)
            GDataBase.className.push($g.typeName(KdbxFile))
            GDataBase.classTarget.push(KdbxFile)
            GDataBase.className.push($g.typeName(GDataFile))
            GDataBase.classTarget.push(GDataFile)
        }
        if (className.length > 0) {
            const index: number = GDataBase.className.indexOf(className)
            if (index > 0) return GDataBase.classTarget[index]
            throw new Error(`无法获取类类型 : ${className}`);
        } else {
            return null
        }
    }

    /** 获取保存对象 */
    public abstract getInfo(): Object;
    /** 载入保存对象 */
    public abstract setInfo(o: Object): void;
}

/** 库 */
export class GDataLib extends GDataBase {

    /** 用户的访问日志 */
    public accessLog: Array<AccessLog> = new Array<AccessLog>();
    /** 里面存放多个用户的库 */
    public lib: Array<GDataItem> = new Array<GDataItem>();

    /** 本数据对象需要保存的内容 */
    private static typeList: Array<string> = ['accessLog', 'lib']

    /** 选中库 */
    private _select?: GDataItem;

    /** 获取用户选中的库 */
    public get select(): GDataItem | null {
        if (this._select) return this._select
        return null
    }

    /** 打开用户最后使用的密码管理器 */
    public openListFile(): GDataItem | null {
        if (this.accessLog.length) {
            const item: AccessLog = this.accessLog[0]
            item.localId
        }
        return null
    }

    /** 获取保存对象 */
    public getInfo(): Object {
        return this.getProperty(new Object(), GDataLib.typeList)
    }

    /** 载入保存对象 */
    public setInfo(o: Object): void {
        this.setProperty(o, GDataLib.typeList)
    }
}

/**
 * 用户的访问记录, 第一条是用户最近访问的数据
 */
export class AccessLog extends GDataBase {
    /** 本地记录ID */
    public localId: number = 0;

    /** 文件打开的次数 */
    public timesOpen: number = 0;
    /** 文件第一次访问的时间 */
    public timeFirst: number = 0;
    /** 持续访问时间(秒) */
    public timeLength: number = 0;

    /** 本数据对象需要保存的内容 */
    private static typeList: Array<string> = ['localId', 'timesOpen', 'timeFirst', 'timeLength']

    /** 获取保存对象 */
    public getInfo(): Object {
        return this.getProperty(new Object(), AccessLog.typeList)
    }
    /** 载入保存对象 */
    public setInfo(o: Object): void {
        this.setProperty(o, AccessLog.typeList)
    }
}

/**
 * 用户每一个资料库的信息
 */
export class GDataItem extends GDataBase {

    /** 本地数字编码 */
    public localId: number = 0;
    /** 整体库所存放的目录 */
    public filePath: string = '';
    /** 缓存的密码, 提供给指纹和人脸识别使用 */
    public pass: string = '';
    /** 文件: 原始 Kdbx, 另存 Kdbx */
    public fileSource?: KdbxFile;
    /** 文件: 流式文件 主 Kdbx 文件 */
    public fileStream?: KdbxFile;
    /** 文件: 流式文件 附件 Kdbx 文件 */
    public fileStreamLib: Array<KdbxFile> = new Array<KdbxFile>();

    /** 本数据对象需要保存的内容 */
    private static typeList: Array<string> = ['localId', 'filePath', 'pass', 'fileSource', 'fileStream', 'fileStreamLib']

    /** 获取保存对象 */
    public getInfo(): Object {
        return this.getProperty(new Object(), GDataItem.typeList)
    }
    /** 载入保存对象 */
    public setInfo(o: Object): void {
        this.setProperty(o, GDataItem.typeList)
    }
}

/** Kdbx 文件的信息 */
export class KdbxFile extends GDataBase {

    /** open后的kdbx文件 */
    public kdbx?: Kdbx;
    /** 文件二进制 */
    public byte: ArrayBuffer | null = null;
    /** 文件信息 */
    public info: GDataFile = new GDataFile()

    /** 本数据对象需要保存的内容 */
    private static typeList: Array<string> = ['byte', 'info']

    /** 获取保存对象 */
    public getInfo(): Object {
        return this.getProperty(new Object(), KdbxFile.typeList)
    }
    /** 载入保存对象 */
    public setInfo(o: Object): void {
        this.setProperty(o, KdbxFile.typeList)
    }
}

export class GDataFile extends GDataBase {

    /** 选择的文件名称 */
    public name: string = ''
    /** 文件的路径 */
    public path: string = ''
    /** 文件的大小 */
    public size: string = ''
    /** 文件的 crc32 码 */
    public crc32: string = ''
    /** 上一次访问Unix时间戳 */
    public timeRead: number = 0
    /** 上一次修改Unix时间戳 */
    public timeWrite: number = 0
    /** 本数据对象需要保存的内容 */
    private static typeList: Array<string> = ['name', 'path', 'size', 'crc32', 'timeRead', 'timeWrite']

    /** 获取保存对象 */
    public getInfo(): Object {
        return this.getProperty(new Object(), GDataFile.typeList)
    }
    /** 载入保存对象 */
    public setInfo(o: Object): void {
        this.setProperty(o, GDataFile.typeList)
    }
}