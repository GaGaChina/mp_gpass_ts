import { $g } from "../../frame/speed.do"
import { Entry, Group, Kdbx, ProtectedValue } from "../kdbxweb/types"

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
                        if (base[k] !== undefined && base[k] !== null) {
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
     * this[DBBase] ← info[JSON], 自动处理 DBBase, 没有值将不变
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
                        isBase = DBBase.classIsBase(className)
                        if (isBase) {
                            $g.log('[DBBase]数据升级:' + k)
                        } else {
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
            DBBase.classTarget.push(DBLib, DBItem, DBItemPassWord, DbLog, DbLibCloudWX, DbItemCloudWX, DbLibCount, DbItemCount)
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

    /** 用户全部的id列表, 要包含是否是网络的, 在哪里同步的 */
    public idList: Set<number> = new Set<number>()
    /** 统计里面的内容数量 */
    public count: DbLibCount = new DbLibCount()
    /** 云同步 : 本机上一次上传的时间 */
    public cloudWXTimeUpload: Date = new Date(0)
    /** 云同步 : 本机上一次下载的时间 */
    public cloudWXTimeDownload: Date = new Date(0)
    /** 用户的访问日志 */
    public log: Array<DbLog> = new Array<DbLog>()
    /** 本地全部的库 */
    public lib: Array<DBItem> = new Array<DBItem>()
    /** 本地默认选中的库 */
    public selectId: number = 0
    /** 选中库 */
    private _select?: DBItem

    /** 获取用户选中的库 */
    public get selectItem(): DBItem | null {
        if (this._select && this._select.localId === this.selectId) return this._select
        let item: DBItem | undefined = undefined;
        const l: number = this.lib.length
        if (this.selectId === 0) {
            if (l > 0) {
                item = this.lib[0]
                this.selectId = item.localId
                return item
            }
        } else {
            for (let i = 0; i < l; i++) {
                item = this.lib[i]
                if (item.localId === this.selectId) {
                    return item
                }
            }
        }
        return null
    }

    /** 获取用户选中的库 */
    public get selectDb(): Kdbx | null {
        const item: DBItem | null = this.selectItem
        if (item) return item.db
        return null
    }

    __name__ = 'DBLib'
    /** 本数据对象需要保存的内容 */
    private static outList: Array<string> = ['log', 'lib', 'count', 'selectId', 'fileSizeAll']
    public getInfo(): Object { return this.getProperty(new Object(), DBLib.outList) }
    public setInfo(o: Object): void { this.setProperty(o, DBLib.outList) }
    public getInfoCloud(): Object {
        const info: any = this.getInfo()
        for (let i = 0; i < info.lib.length; i++) {
            const item: any = info.lib[i]
            delete item['pass']
        }
        return info
    }
}

export class DBItem extends DBBase {

    /** 仓库可以接受的正常的名称 */
    public static DBRightName: Set<string> = new Set(['db.kdbx', 'db.min.1.kdbx', 'db.min.2.kdbx', 'db.base64.1.txt', 'db.base64.2.txt'])

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
    /** 微信云同步 */
    public cloudWX: DbItemCloudWX = new DbItemCloudWX()
    /** Item 的一些统计 */
    public count: DbItemCount = new DbItemCount()
    /** 用户选中的展示的组 */
    public displayGroup: Group | null = null
    /** 现在用户选中的组 */
    public selectGroup: Group | null = null
    /** 现在用户选中的条目 */
    public selectEntry: Entry | null = null
    /** 在 Entry 或 Group 中 是否有改变, 这样列表需要重新刷新 */
    public infoRefresh: boolean = false
    /** 正在添加的组 */
    public addGroup: Group | null = null
    /** 正在添加的条目 */
    public addEntry: Entry | null = null
    /** 现在选中的组 uuid */
    public selectGroupUUID: string = ''
    /** 现在选中的 Entry uuid */
    public selectEntryUUID: string = ''
    /** 迷你版本的备份地址, 0 未备份, 1 主要是1 , 2 最新是2号 db.min.1.kdbx, 3 db.base64.1.txt, 3 db.base64.1.txt, 4 db.base64.2.txt  */
    public pathMinIndex: number = 0
    /** AES加密内容 Base64 缓存的密码, 提供给指纹和人脸识别使用 */
    public pass: DBItemPassWord = new DBItemPassWord()
    /** 解密打开的 kdbx 文件 */
    public db: Kdbx | null = null
    /** 生成的需要删除的临时文件, 直接删除会导致发送不成功 */
    public tempFileList: Array<string> = new Array<string>()

    /** 垃圾桶的UUID */
    public recycleUUID: string = ''
    /** 用户的组最大层级 */
    public groupMaxLevel: number = 0
    /** 缓存 Entry 的 GKV 对象 通过 UUIDPath → gkv 对象, 如果有就不用在获取 */
    public entryUUIDgkv: { [key: string]: Object | null } = {}
    /** 归纳全部的 Entry UUID 路径(清理无用 UUID 文件夹) */
    public entryUUIDPath: Set<string> = new Set<string>()
    /** 统计出全部的 ref 附件的库 */
    public refLib: Set<string> = new Set<string>()
    /** 统计出回收站的 ref 附件的库(正常条目被剥离) */
    public refRecycleLib: Set<string> = new Set<string>()
    /** 统计出历史记录的 ref 附件的库(正常条目被剥离) */
    public refHistoryLib: Set<string> = new Set<string>()
    /** db 的 kdbx 内容是否发生了变化, 如果变化, 意味着可以保存文件 */
    public changeDB: boolean = false
    /** db 的信息有无发生变化, 有就可以保存整个DBLib */
    public changeItem: boolean = false

    /** 获取现在可以导出的文件名 */
    public get dbPath(): string {
        if (this.pathMinIndex === 0) {
            return 'db.kdbx'
        } else if (this.pathMinIndex === 1) {
            return 'db.min.1.kdbx'
        } else if (this.pathMinIndex === 2) {
            return 'db.min.2.kdbx'
        } else if (this.pathMinIndex === 3) {
            return 'db.base64.1.txt'
        } else if (this.pathMinIndex === 4) {
            return 'db.base64.2.txt'
        }
        return ''
    }

    __name__ = 'DBItem'
    /** 本数据对象需要保存的内容 */
    private static outList: Array<string> = ['localId', 'icon', 'name', 'filename', 'path', 'count', 'pathMinIndex', 'timeCreat', 'timeRead', 'timeChange', 'fileSizeAll', 'pass', 'tempFileList', 'cloudWX']
    public getInfo(): Object { return this.getProperty(new Object(), DBItem.outList) }
    public setInfo(o: Object): void { this.setProperty(o, DBItem.outList) }
}

/** 已 Base64 进行存储 */
export class DBItemPassWord extends DBBase {

    /** 缓存用户的密码, 当用户未开启人脸和指纹的时候 */
    public pv: ProtectedValue | null = null
    /** 人脸识别中记录的密码 */
    public facial: string = ''
    /** 指纹识别中记录的密码 */
    public fingerPrint: string = ''

    __name__ = 'DBItemPassWord'
    /** 本数据对象需要保存的内容 */
    private static typeList: Array<string> = ['facial', 'fingerPrint']
    public getInfo(): Object { return this.getProperty(new Object(), DBItemPassWord.typeList) }
    public setInfo(o: Object): void { this.setProperty(o, DBItemPassWord.typeList) }
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

/** 云同步 : 微信云平台 */
export class DbLibCloudWX extends DBBase {

    /** 是否启用 */
    public enable: boolean = false

    __name__ = 'DbLibCloudWX'
    /** 本数据对象需要保存的内容 */
    private static typeList: Array<string> = ['enable']
    public getInfo(): Object { return this.getProperty(new Object(), DbLibCloudWX.typeList) }
    public setInfo(o: Object): void { this.setProperty(o, DbLibCloudWX.typeList) }
}

/** 云同步 : 微信云平台 */
export class DbItemCloudWX extends DBBase {

    /** 是否启用 */
    public enable: boolean = false
    /** 是否上传过文件 */
    public upload: boolean = false
    /** 上次上传时间 */
    public timeUpload: Date = new Date(0)
    /** 上次下载时间 */
    public timeDownload: Date = new Date(0)
    /** 上传的版本更改的时间 */
    public timeChange: Date = new Date(0)

    __name__ = 'DbItemCloudWX'
    /** 本数据对象需要保存的内容 */
    private static typeList: Array<string> = ['enable', 'upload', 'timeUpload', 'timeDownload', 'timeChange']
    public getInfo(): Object { return this.getProperty(new Object(), DbItemCloudWX.typeList) }
    public setInfo(o: Object): void { this.setProperty(o, DbItemCloudWX.typeList) }
}

/** 使用状态统计 */
export class DbLibCount extends DBBase {

    /** 文件夹下的文件总大小 */
    public sizeFolder: number = 0
    /** kdbx原始文件的大小 */
    public sizeKdbxByte: number = 0

    __name__ = 'DbLibCount'
    /** 本数据对象需要保存的内容 */
    private static typeList: Array<string> = ['sizeFolder', 'sizeKdbxByte']
    public getInfo(): Object { return this.getProperty(new Object(), DbLibCount.typeList) }
    public setInfo(o: Object): void { this.setProperty(o, DbLibCount.typeList) }
}

/** 使用状态统计 */
export class DbItemCount extends DBBase {

    /** 统计 : 用户所拥有的 Entry 的数量 */
    public entry: number = 0
    /** 统计 : 用户所拥有的 Group 的数量 */
    public group: number = 0
    /** 统计 : 用户回收站 Entry 的数量 */
    public entryRecycle: number = 0
    /** 统计 : 用户回收站 Group 的数量 */
    public groupRecycle: number = 0


    /** 文件创建的时间 */
    public timeCreat: Date = new Date()
    /** 文件读取的时间 */
    public timeRead: Date = new Date()
    /** 文件读取的时间 */
    public timeChange: Date = new Date()
    /** 文件夹下的文件总大小 */
    public sizeFolder: number = 0
    /** kdbx原始文件的大小 */
    public sizeKdbxByte: number = 0

    __name__ = 'DbItemCount'
    /** 本数据对象需要保存的内容 */
    private static typeList: Array<string> = ['entry', 'group', 'timeCreat', 'timeRead', 'timeChange', 'sizeFolder', 'sizeKdbxByte']
    public getInfo(): Object { return this.getProperty(new Object(), DbItemCount.typeList) }
    public setInfo(o: Object): void { this.setProperty(o, DbItemCount.typeList) }
}