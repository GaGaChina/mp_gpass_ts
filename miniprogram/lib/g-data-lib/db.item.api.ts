import { $g } from "../../frame/speed.do"
import { ToolBytes } from "../../frame/tools/tool.bytes"
import { WXFile } from "../../frame/wx/wx.file"
import { WXSoterAuth } from "../../frame/wx/wx.soter.auth"
import { Kdbx, ProtectedValue } from "../kdbxweb/types"
import { DBItem, DBLib, DbLibCloudWX } from "./db"
import { DBItemCheckApi } from "./db.item.check.api"
import { DBLibApi } from "./db.lib.api"
import { KdbxApi } from "./kdbx.api"

/**
 * 
 */
export class DBItemApi {

    /**
     * 通过本地路径文件, 来打开 db
     * @param dbLib 
     * @param dbItem 
     * @param passPV 
     */
    public static async open(dbLib: DBLib, dbItem: DBItem, passPV: ProtectedValue) {
        await $g.step.inJump('读取本地二进制文件')
        // string | ArrayBuffer | null
        let readByte: any = null
        let filePath: string = `db/${dbItem.path}/${dbItem.dbPath}`
        $g.log(`[DBItemApi.open]${filePath}`)
        if (dbItem.pathMinIndex === 3 || dbItem.pathMinIndex === 4) {
            readByte = await WXFile.readFile(filePath, 0, undefined, 'utf-8')
            readByte = ToolBytes.Base64ToArrayBuffer(readByte)
        } else {
            readByte = await WXFile.readFile(filePath)
        }
        // $g.log('文件', filePath, '内容', readByte);
        // if ($g.isTypeM(readByte, 'ArrayBuffer')) {
        //     const a: any = readByte
        //     const demo: GByteStream = new GByteStream(a, true)
        //     const n1: number = demo.rUint32()
        //     const n2: number = demo.rUint32()
        //     $g.log(`读取的脑袋头 n1 : ${n1} n2 : ${n2}`)
        // }

        // 测试读取 binary 不行, 读取 base64 也没用
        // readByte = await WXFile.readFile(filePath, 0, undefined, 'base64')
        // if ($g.isString(readByte)) {
        //     const temp: any = readByte
        //     readByte = ToolBytes.Base64ToArrayBuffer(temp)
        //     $g.log('转换后 : ', readByte)
        // }
        if (readByte === null) {
            wx.showModal({ title: '失败', content: '未在本地路径获取到文件!', showCancel: false })
        } else if ($g.isTypeM(readByte, 'ArrayBuffer')) {
            await $g.step.inJump('解密本地档案')
            const byte: ArrayBuffer = readByte
            const db: Kdbx | null = await KdbxApi.open(byte, passPV.getText());
            if (db) {
                let savePass: boolean = false
                if (WXSoterAuth.facial && dbItem.pass.facial === '') savePass = true
                if (WXSoterAuth.fingerPrint && dbItem.pass.fingerPrint === '') savePass = true
                dbItem.pass.pv = savePass ? KdbxApi.getPassPV(passPV.getText()) : null
                dbItem.db = db
                await DBItemCheckApi.check(dbItem)
                if (dbItem.changeDB) {
                    await DBItemApi.saveFileAddStorage(dbLib, dbItem)
                } else if (dbItem.changeItem) {
                    DBLibApi.storageSave(dbLib)
                }
            } else {
                wx.showModal({ title: '失败', content: '打开仓库失败, 请检查密码!', showCancel: false })
            }
        } else {
            wx.showModal({ title: '失败', content: '文件类型不符, 非二进制!' + $g.className(readByte), showCancel: false })
        }
    }

    // 关闭的时候执行, 包括一系列的清理
    public static close(dbItem: DBItem): void {

    }

    /** 保存 DbItem 到磁盘, 并且保存 DbLib 到 Storage */
    /**
     * DbItem (保存文件) DbLib (保存Storage) 
     * devtools 用 Base64 保存
     * 其他 用 二进制 保存
     */
    public static async saveFileAddStorage(dbLib: DBLib, dbItem: DBItem) {
        if (dbItem.db) {
            await $g.step.inJump('加密档案内容', '保存档案文件', '更新档案记录')
            const byte: ArrayBuffer = await dbItem.db.save()
            $g.log('[DBItemApi.saveFileAddStorage]', byte.byteLength)
            if (byte && byte.byteLength > 0) {
                await $g.step.next()
                if ($g.g.systemInfo.brand === 'devtools') {
                    // 如果是开发者工具, 存Base64, 因为二进制不稳定
                    const base64: string = ToolBytes.ArrayBufferToBase64(byte)
                    if (dbItem.pathMinIndex === 3) {
                        if (await WXFile.writeFile(`db/${dbItem.path}/db.base64.2.txt`, base64)) dbItem.pathMinIndex = 4
                    } else {
                        if (await WXFile.writeFile(`db/${dbItem.path}/db.base64.1.txt`, base64)) dbItem.pathMinIndex = 3
                    }
                } else {
                    if (dbItem.pathMinIndex === 1) {
                        if (await WXFile.writeFile(`db/${dbItem.path}/db.min.2.kdbx`, byte, 0, 'binary')) dbItem.pathMinIndex = 2
                    } else {
                        if (await WXFile.writeFile(`db/${dbItem.path}/db.min.1.kdbx`, byte, 0, 'binary')) dbItem.pathMinIndex = 1
                    }
                }
                dbItem.changeDB = false
                dbItem.changeItem = true
                DBLibApi.storageSave(dbLib)
                await $g.step.next()
            }
        } else {
            $g.log('[DBItemApi.saveFileAddStorage] 失败, db空')
        }
    }

    /** 抽取文件的数量 */
    private getGroupToDiskTotle: number = 0
    private getGroupToDiskStr: string = '附件加密存储'

}