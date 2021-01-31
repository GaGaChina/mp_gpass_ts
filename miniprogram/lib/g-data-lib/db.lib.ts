import { $g } from "../../frame/speed.do"
import { DBBase } from "./db.base"
import { DBItem } from "./db.item"
import { DbLog } from "./db.log"

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
