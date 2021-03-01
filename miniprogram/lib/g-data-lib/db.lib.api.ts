import { $g } from "../../frame/speed.do";
import { WXFile } from "../../frame/wx/wx.file";
import { DBItem, DBLib } from "./db";
import { DBItemCheckApi } from "./db.item.check.api";

export class DBLibApi {

    /**
     * 通过 localId 查询
     * @param dbLib 
     * @param localId 
     */
    public static getItem(dbLib: DBLib, localId: number): DBItem | null {
        for (let i = 0; i < dbLib.lib.length; i++) {
            let o: DBItem = dbLib.lib[i]
            if (o.localId === localId) return o
        }
        return null
    }

    /** 删除 localId 库 */
    public static async remove(dbLib: DBLib, localId: number): Promise<boolean> {
        for (let i = 0; i < dbLib.lib.length; i++) {
            const o: DBItem = dbLib.lib[i]
            if (o.localId === localId) {
                dbLib.lib.splice(i, 1)
                await WXFile.rmDir(`db/${o.path}`, true)
                dbLib.count.sizeFolder = dbLib.count.sizeFolder - o.count.sizeFolder
                if (dbLib.count.sizeFolder < 0) dbLib.count.sizeFolder = 0
                DBLibApi.storageSave(dbLib)
                return true
            }
        }
        return false
    }

    /**
     * 检查 DBItem 的文件夹, 返回是否拥有 kdbx 数据库
     * @param dbItem 
     */
    public static async check(dbLib: DBLib): Promise<any> {
        let l: number = dbLib.lib.length
        let sizeFolder: number = 0
        let sizeKdbxByte: number = 0
        while (--l > -1) {
            const o: DBItem = dbLib.lib[l]
            if (await DBItemCheckApi.check(o)) {
                sizeFolder += o.count.sizeFolder
                sizeKdbxByte += o.count.sizeKdbxByte
            } else {
                // 目录下没有数据库文件, 云仓库(不会出现在本地)
                $g.log('[DBLibApi.check]清理仓库:', o.name, o.localId)
                dbLib.lib.splice(l, 1)
                await WXFile.rmDir(`db/${o.path}`, true)
                dbLib.count.sizeFolder = dbLib.count.sizeFolder - o.count.sizeFolder
                if (dbLib.count.sizeFolder < 0) dbLib.count.sizeFolder = 0
            }
        }
        dbLib.count.sizeFolder = sizeFolder
        dbLib.count.sizeKdbxByte = sizeKdbxByte
        return void 0
    }

    /**
     * 检查 DBItem 的文件夹, 返回是否拥有 kdbx 数据库
     * @param dbItem 
     */
    public static countFileSize(dbLib: DBLib): void {
        let l: number = dbLib.lib.length
        let sizeFolder: number = 0
        let sizeKdbxByte: number = 0
        while (--l > -1) {
            const o: DBItem = dbLib.lib[l]
            sizeFolder += o.count.sizeFolder
            sizeKdbxByte += o.count.sizeKdbxByte
        }
        dbLib.count.sizeFolder = sizeFolder
        dbLib.count.sizeKdbxByte = sizeKdbxByte
    }

    /** 将这个数据存储到 Storage 的Info 里 */
    public static storageSave(lib: DBLib) {
        for (let i = 0; i < lib.lib.length; i++) {
            const item: DBItem = lib.lib[i]
            item.changeItem = false
        }
        const o: Object = lib.getInfo()
        $g.s.storageSet('dbLibInfo', o)
    }

    /** 通过 storage 里的数据设置这个对象 */
    public static storageRead(lib: DBLib) {
        const o: any = $g.s.storageGet('dbLibInfo')
        if (o) lib.setInfo(o)
    }

}