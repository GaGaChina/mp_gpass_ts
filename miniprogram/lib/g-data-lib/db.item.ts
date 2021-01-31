// import { AES } from "../../frame/crypto/AES";
import { $g } from "../../frame/speed.do";
import { WXFile } from "../../frame/wx/wx.file";
import { Entry, Group, Kdbx, KdbxUuid } from "../kdbxweb/types";
import { DBBase } from "./db.base";

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
        const db: Kdbx | null = this.db
        if (db) {
            await this.getGroupToDisk(db.groups)
            const byte: ArrayBuffer = await db.save()
            if (byte) {
                await WXFile.writeFile(`db/${this.path}/db.kdbx`, byte)
            }
        }
    }

    /** 遍历组内的文件 */
    private async getGroupToDisk(groups: Group[]) {
        let l: number = groups.length
        if (l > 0) {
            for (let i = 0; i < groups.length; i++) {
                const group: Group = groups[i];
                await this.getGroupToDisk(group.groups)
                await this.getEntrieToDisk(group.entries)
            }
        }
    }

    private async getEntrieToDisk(entries: Entry[]) {
        let l: number = entries.length
        if (l > 0) {
            for (let i = 0; i < entries.length; i++) {
                const entrie: Entry = entries[i]
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
                    let pass: string = KdbxUuid.random().toString()
                    let byte: ArrayBuffer = fileInfo.value
                    // Aes
                    // await AES.importKeyStr(pass)
                    // byte = await AES.encrypt(byte, null)
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