import { $g } from "../../frame/speed.do";
import { WXFile } from "../../frame/wx/wx.file";
import { Kdbx, Times } from "../kdbxweb/types";
import { DBBase } from "./db.lib.base";


/**
 * 本地的数据
 */
export class DBLib extends DBBase {

    /** 用户的访问日志 */
    public accessLog: Array<AccessLog> = new Array<AccessLog>()
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
        if (this.accessLog.length) {
            const item: AccessLog = this.accessLog[0]
            item.localId
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

    __name__ = 'DBLib'
    /** 本数据对象需要保存的内容 */
    private static outList: Array<string> = ['accessLog', 'lib', 'selectId', 'fileSizeAll']
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
    public pass: string = '';
    /** 解密打开的 kdbx 文件 */
    public db: Kdbx | null = null;

    /** 获取这个目录下文件的尺寸 */
    public async fileSize(): Promise<number> {
        if (this.path) {
            this.fileSizeAll = await WXFile.getFileSize(`db/${this.path}`)
        }
        return Promise.resolve(this.fileSizeAll)
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
export class AccessLog extends DBBase {

    /** 本地记录ID */
    public localId: number = 0;
    /** 文件打开的次数 */
    public timesOpen: number = 0;
    /** 文件第一次访问的时间 */
    public timeFirst: number = 0;
    /** 持续访问时间(秒) */
    public timeLength: number = 0;


    __name__ = 'AccessLog'
    /** 本数据对象需要保存的内容 */
    private static typeList: Array<string> = ['localId', 'timesOpen', 'timeFirst', 'timeLength']
    public getInfo(): Object { return this.getProperty(new Object(), AccessLog.typeList) }
    public setInfo(o: Object): void { this.setProperty(o, AccessLog.typeList) }
}