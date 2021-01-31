import { AES } from "./../../frame/crypto/AES"
import { $g } from "../../frame/speed.do"
import { WXFile } from "../../frame/wx/wx.file"
import { Kdbx } from "../kdbxweb/types"
import { KdbxApi } from "./kdbx.api"

interface IDB {
    getInfo(): Object;
    setInfo(o: Object): void;
}

/** 基类, 不能初始化使用 */
export abstract class DBBase implements IDB {

    public __name__: string = 'DBBase'

    /**
     * this[DBBase] → info[JSON]
     * @param info 写入JSON对象
     * @param key 操作键名或键名列表
     */
    public getProperty(info: Object, key: string | Array<string>): Object {
        const a: any = $g.isString(key) ? [key] : key
        const base: any = this
        const json: any = info
        let className: string;
        let isBase: boolean;
        for (let i: number = 0, l: number = a.length; i < l; i++) {
            const k: string = a[i]
            if (base[k] !== null) {
                if ($g.isArray(base[k])) {
                    if (base[k].length > 0) {
                        const res: Array<Object> = new Array<Object>()
                        json[k] = res
                        let temp = base[k][0]
                        className = $g.className(temp)
                        isBase = DBBase.classIsBase(className)
                        for (let j: number = 0, jl: number = base[k].length; j < jl; j++) {
                            if (isBase) {
                                temp = base[k][j].getInfo()
                                temp.__name__ = className
                                res.push(temp)
                            } else {
                                res.push(base[k][j])
                            }
                        }
                    }
                } else {
                    className = $g.className(base[k])
                    isBase = DBBase.classIsBase(className)
                    if (isBase) {
                        json[k] = base[k].getInfo()
                        json[k].__name__ = $g.className(base[k])
                    } else {
                        if (!$g.isUndefined(base[k]) && !$g.isNull(base[k])) {
                            switch (className) {
                                case 'Date':
                                    json[k] = base[k].getTime()
                                    break;
                                default:
                                    json[k] = base[k]
                            }
                        }
                    }
                }
            }
        }
        return info
    }

    /**
     * this[DBBase] ← info[JSON], 自动处理 DBBase
     * @param info 读取JSON对象
     * @param key 操作键名或键名列表
     */
    public setProperty(info: Object, key: string | Array<string>): void {
        const a: any = $g.isString(key) ? [key] : key
        const base: any = this
        const json: any = info
        let className: string;
        let c: { new(): DBBase; } | null;
        let co: DBBase;
        let isBase: boolean;
        for (let i: number = 0, l: number = a.length; i < l; i++) {
            const k: string = a[i]
            if ($g.hasKey(info, k) && $g.hasKey(base, k)) {
                if ($g.isArray(json[k])) {
                    const jsonA: Array<any> = json[k]
                    let l: number = jsonA.length
                    base[k].length = 0
                    if (l) {
                        className = $g.className(jsonA[0])
                        isBase = DBBase.classIsBase(className)
                        if (isBase) {
                            c = DBBase.getClassObject(className)
                        } else {
                            c = null
                        }
                        for (let i: number = 0; i < l; i++) {
                            if (c) {
                                co = new c()
                                base[k].push(co)
                                co.setInfo(jsonA[i])
                            } else {
                                base[k].push(jsonA[i])
                            }
                        }
                    }
                } else {
                    className = $g.className(json[k])
                    isBase = DBBase.classIsBase(className)
                    if (isBase) {
                        c = DBBase.getClassObject(className)
                        if (c) {
                            base[k] = new c()
                        }
                        base[k].setInfo(json[k])
                    } else {
                        className = $g.className(base[k])
                        switch (className) {
                            case 'Date':
                                base[k] = new Date(json[k])
                                break;
                            default:
                                base[k] = json[k]
                        }
                    }
                }
            }
        }
    }

    /** 类名称 */
    private static className: Array<string> = []
    private static classTarget: Array<{ new(): DBBase; }> = []

    /** 根据 className 获取对象 */
    private static getClassObject(className: string): { new(): DBBase; } | null {
        DBBase.classInit()
        if (DBBase.className.length > 0) {
            const index: number = DBBase.className.indexOf(className)
            if (index > -1) return DBBase.classTarget[index]
            throw new Error(`无法获取类类型 : ${className}`);
        } else {
            return null
        }
    }

    /** 检查是否是 base 基类 */
    private static classIsBase(className: string): boolean {
        DBBase.classInit()
        if (DBBase.className.length > 0) {
            const index: number = DBBase.className.indexOf(className)
            if (index > -1) return true
        }
        return false
    }

    /** 初始化类和名称的对应表 */
    private static classInit(): void {
        if (DBBase.className.length === 0) {
            DBBase.classTarget.push(DBLib, DBItem, DbLog)
            for (let i = 0, l: number = DBBase.classTarget.length; i < l; i++) {
                const element = DBBase.classTarget[i];
                DBBase.className.push($g.className(new element()))
            }
        }
    }

    /** 获取保存对象 */
    public abstract getInfo(): Object;
    /** 载入保存对象 */
    public abstract setInfo(o: Object): void;
}


/**
 * 本地的数据
 */
export class DBLib extends DBBase {

    /** 用户的访问日志 */
    public log: Array<DbLog> = new Array<DbLog>()
    /** 本地全部的库 */
    public lib: Array<DBItem> = new Array<DBItem>()
    /** 本地最大可以存放文件尺寸 */
    public fileSizeMax: number = 1024 * 1024 * 200
    /** 本地现在的文件尺寸总和 */
    public fileSizeAll: number = 0
    /** 本地默认选中的库 */
    public selectId: number = 0
    /** 选中库 */
    private _select?: DBItem
    /** 获取用户选中的库 */
    public get selectDB(): DBItem | null {
        if (this._select && this._select.localId === this.selectId) return this._select
        let item: DBItem | undefined = undefined;
        if (this.selectId === 0) {
            if (this.lib.length) {
                item = this.lib[0]
                this.selectId = item.localId
                return item
            }
        } else {
            for (let i = 0, l: number = this.lib.length; i < l; i++) {
                item = this.lib[i]
                if (item.localId === this.selectId) {
                    return item
                }
            }
        }
        return null
    }

    /**
     * 递归 Lib 库设置以下属性
     * fileSizeAll : 现在空间总共使用的尺寸
     */
    public setDbLibInfo() {
        this.fileSizeAll = 0
        for (let i = 0, l: number = this.lib.length; i < l; i++) {
            const item: DBItem = this.lib[i];
            this.fileSizeAll += item.fileSizeAll
        }
    }

    /** 打开用户最后使用的密码管理器 */
    public openListFile(): DBItem | null {
        if (this.log.length) {
            const item: DbLog = this.log[0]

        }
        return null
    }

    /** 将这个数据存储到 Storage 的Info 里 */
    public storageSaveThis() {
        const info: Object = this.getInfo()
        $g.s.storageSet('dbLibInfo', info)
    }

    /** 通过 storage 里的数据设置这个对象 */
    public storageSetThis() {
        const info: any = $g.s.storageGet('dbLibInfo')
        if (info) {
            this.setInfo(info)
        }
    }

    /** 获取这个目录下文件的尺寸 */
    public fileSize(): number {
        this.fileSizeAll = 0
        for (let i = 0, l: number = this.lib.length; i < l; i++) {
            const item: DBItem = this.lib[i]
            this.fileSizeAll += item.fileSizeAll
        }
        return this.fileSizeAll
    }

    /** [重新获取递归]获取这个目录下文件的尺寸 */
    public async fileSizeRun(): Promise<number> {
        this.fileSizeAll = 0
        for (let i = 0, l: number = this.lib.length; i < l; i++) {
            const item: DBItem = this.lib[i]
            this.fileSizeAll += await item.fileSize()
        }
        return Promise.resolve(this.fileSizeAll)
    }

    checkFile() {
        $g.log(`开始检查空白档案`);
        let l: number = this.lib.length;
        if (l) {
            while (--l > -1) {
                let item = this.lib[l];
                if (item.checkFile() === false) {
                    $g.log(`删除空白档案 : ${item.name}`);
                    this.lib.splice(l, 1);
                }
            }
        }
    }

    __name__ = 'DBLib'
    /** 本数据对象需要保存的内容 */
    private static outList: Array<string> = ['log', 'lib', 'selectId', 'fileSizeAll']
    public getInfo(): Object { return this.getProperty(new Object(), DBLib.outList) }
    public setInfo(o: Object): void { this.setProperty(o, DBLib.outList) }
}



export class DBItem extends DBBase {


    /** 本地数字编码 new Date().getTime() */
    public localId: number = 0;
    /** 库图标 */
    public icon: string = 'database'
    /** 档案的名称 */
    public name: string = '档案名称'
    /** 用户导入的时候文件名 `db/${dbItem.path}/db.kdbx` */
    public filename: string = ''
    /** 文件存放在 db 文件夹下的 使用 localId */
    public path: string = ''
    /** 文件创建的时间 */
    public timeCreat: Date = new Date()
    /** 文件读取的时间 */
    public timeRead: Date = new Date()
    /** 文件读取的时间 */
    public timeChange: Date = new Date()
    /** 文件夹下的文件总大小 */
    public fileSizeAll: number = 0
    /** AES加密内容 Base64 缓存的密码, 提供给指纹和人脸识别使用 */
    public pass: string = ''
    /** 解密打开的 kdbx 文件 */
    public db: Kdbx | null = null

    /** 获取这个目录下文件的尺寸 */
    public async fileSize(): Promise<number> {
        if (this.path) {
            this.fileSizeAll = await WXFile.getFileSize(`db/${this.path}`)
        }
        return Promise.resolve(this.fileSizeAll)
    }

    /**
     * 检查目录下是否有这个文件, 并不为0
     */
    public checkFile(): boolean {
        if (this.path) {
            const info: any = WXFile.getFileStat(`db/${this.path}/db.kdbx`)
            if (info && info.size > 0) {
                return true
            }
        }
        return false
    }

    /** 将里面的附件抽出, 并转换为文件存在本地 */
    public async getFileToDisk() {
        // const db: Kdbx | null = this.db
        const db: any | null = this.db
        if (db) {
            await this.getGroupToDisk(db.groups)
            const byte: ArrayBuffer = await db.save()
            if (byte) {
                await WXFile.writeFile(`db/${this.path}/db.kdbx`, byte)
            }
        }
    }

    /** 遍历组内的文件 */
    // private async getGroupToDisk(groups: Group[]) {
    private async getGroupToDisk(groups: any[]) {
        let l: number = groups.length
        if (l > 0) {
            for (let i = 0; i < groups.length; i++) {
                //const group: Group = groups[i];
                const group: any = groups[i]
                await this.getGroupToDisk(group.groups)
                await this.getEntrieToDisk(group.entries)
            }
        }
    }

    // private async getEntrieToDisk(entries: Entry[]) {
    private async getEntrieToDisk(entries: any[]) {
        let l: number = entries.length
        if (l > 0) {
            for (let i = 0; i < entries.length; i++) {
                // const entrie: Entry = entries[i]
                const entrie: any = entries[i]
                const uuid: string = entrie.uuid.toString()
                const binaries: any = entrie.binaries
                const fileList: Array<string> = Object.keys(binaries)
                let gkv: any = {}
                if ($g.hasKey(entrie.fields, 'GKeyValue')) {
                    const gkvJSON: any = entrie.fields['GKeyValue']
                    gkv = JSON.parse(gkvJSON)
                }
                let jsonFileList: Array<any> = new Array<any>()
                if ($g.hasKey(gkv, 'filelist')) {
                    jsonFileList = gkv.filelist
                }
                for (let j = 0; j < fileList.length; j++) {
                    const fileName: string = fileList[j]
                    const fileInfo: any = binaries[fileName]
                    const ref: string = fileInfo.ref
                    let pass: string = (KdbxApi.kdbxweb.KdbxUuid as any).random().toString()
                    let byte: ArrayBuffer = fileInfo.value
                    // Aes
                    await AES.importKeyStr(pass)
                    byte = await AES.encrypt(byte, null)
                    // 创建本地文件 AES 加密
                    const newPath: string = uuid + ref
                    await WXFile.writeFile(`db/${this.path}/${newPath}`, byte)
                    const fileItem: object = {
                        name: fileName,
                        ref: ref,
                        path: newPath,
                        pass: pass,
                    }
                    jsonFileList.push(fileItem)
                    delete binaries[fileName]
                }
                entrie.fields['GKeyValue'] = JSON.stringify(gkv)
            }
        }
    }

    __name__ = 'DBItem'
    /** 本数据对象需要保存的内容 */
    private static outList: Array<string> = ['localId', 'icon', 'name', 'filename', 'path', 'timeCreat', 'timeRead', 'timeChange', 'fileSizeAll', 'pass']
    public getInfo(): Object { return this.getProperty(new Object(), DBItem.outList) }
    public setInfo(o: Object): void { this.setProperty(o, DBItem.outList) }
}


/**
 * 用户的访问记录, 第一条是用户最近访问的数据
 */
export class DbLog extends DBBase {

    /** 本地记录ID */
    public localId: number = 0
    /** 文件打开的次数 */
    public timesOpen: number = 0
    /** 文件第一次访问的时间 */
    public timeFirst: Date = new Date()
    /** 持续访问时间(秒) */
    public timeLength: number = 0

    __name__ = 'DbLog'
    /** 本数据对象需要保存的内容 */
    private static typeList: Array<string> = ['localId', 'timesOpen', 'timeFirst', 'timeLength']
    public getInfo(): Object { return this.getProperty(new Object(), DbLog.typeList) }
    public setInfo(o: Object): void { this.setProperty(o, DbLog.typeList) }
}