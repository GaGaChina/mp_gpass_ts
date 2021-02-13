import { AES } from "./../../frame/crypto/AES"
import { $g } from "../../frame/speed.do"
import { WXFile } from "../../frame/wx/wx.file"
import { Entry, Group, Kdbx, ProtectedValue } from "../kdbxweb/types"
import { KdbxApi } from "./kdbx.api"
import { ToolBytes } from "../../frame/tools/tool.bytes"
import { WXSoterAuth } from "../../frame/wx/wx.soter.auth"
import { WXKeepScreen } from "../../frame/wx/wx.keep.screen"

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
            DBBase.classTarget.push(DBLib, DBItem, DBItemPassWord, DbLog)
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

    /** 通过 localId 查询 */
    public selectLocalId(localId: number): DBItem | null {
        const l: number = this.lib.length
        if (l) {
            for (let i = 0; i < l; i++) {
                let item: DBItem = this.lib[i]
                if (item.localId === localId) {
                    return item
                }
            }
        }
        return null
    }

    /** 删除某个id的库 */
    public async remove(localId: number): Promise<boolean> {
        for (let i = 0; i < this.lib.length; i++) {
            if (this.lib[i].localId === localId) {
                this.lib.splice(i, 1)
                await this.lib[i].rmDir()
                this.storageSaveThis()
                return true
            }
        }
        return false
    }


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

    /** [重新获取递归]获取这个目录下文件的尺寸 性能消耗 */
    public async fileSizeRun(): Promise<number> {
        this.fileSizeAll = 0
        for (let i = 0, l: number = this.lib.length; i < l; i++) {
            const item: DBItem = this.lib[i]
            this.fileSizeAll += await item.fileSize()
        }
        return Promise.resolve(this.fileSizeAll)
    }

    /** 检查dbLib下如果 kbdx 为空就删除, 如果有文件夹没在 db 内也删除 */
    public async checkFile() {
        $g.log(`[DbLib]检查空白档案`);
        let l: number = this.lib.length;
        if (l) {
            while (--l > -1) {
                let item = this.lib[l];
                if (item.db && await item.checkFile() === false) {
                    $g.log(`[DbLib]删空档案 : ${item.name}`, item);
                    // 清理文件夹
                    await item.rmDir()
                    this.lib.splice(l, 1)
                }
            }
        }
        // 删除不在 dbLib 的空白文件夹
        const list: Array<string> = await WXFile.readdir('db')
        for (let i = 0; i < list.length; i++) {
            const path: string = list[i]
            if (this.getDbItemForPath(path) === null) {
                $g.log(`[DbLib][ O_O 后期要有提示 ]删除未记录的文件夹 : db/${path}`)
                await WXFile.rmDir(`db/${path}`)
            }
        }
    }

    /** 通过文件路径获取 DbItem */
    public getDbItemForPath(path: string): DBItem | null {
        const l: number = this.lib.length
        for (let i = 0; i < l; i++) {
            const item: DBItem = this.lib[i]
            if (item.path === path) {
                return item
            }
        }
        return null
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
    /** 现在用户选中的组 */
    public selectGroup: Group | null = null
    /** 现在用户选中的条目 */
    public selectEntry: Entry | null = null
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
    /** 文件创建的时间 */
    public timeCreat: Date = new Date()
    /** 文件读取的时间 */
    public timeRead: Date = new Date()
    /** 文件读取的时间 */
    public timeChange: Date = new Date()
    /** 文件夹下的文件总大小 */
    public fileSizeAll: number = 0
    /** AES加密内容 Base64 缓存的密码, 提供给指纹和人脸识别使用 */
    public pass: DBItemPassWord = new DBItemPassWord()
    /** 解密打开的 kdbx 文件 */
    public db: Kdbx | null = null
    /** 生成的需要删除的临时文件, 直接删除会导致发送不成功 */
    public tempFileList: Array<string> = new Array<string>()

    /** 获取这个目录下文件的尺寸 */
    public async fileSize(): Promise<number> {
        $g.log('[DBItem][fileSize]')
        if (this.path) {
            const newSize: number = await WXFile.getFileSize(`db/${this.path}`, true)
            if (newSize !== this.fileSizeAll) {
                this.fileSizeAll = newSize;
                ($g.g.dbLib as DBLib).storageSaveThis()
            }
        }
        return Promise.resolve(this.fileSizeAll)
    }

    /**
     * 检查目录下是否有这个文件, 并不为0
     */
    public async checkFile(): Promise<boolean> {
        if (this.path) {
            const checkList: Array<string> = ['db.kdbx', 'db.min.1.kdbx', 'db.min.2.kdbx', 'db.base64.1.txt', 'db.base64.2.txt']
            for (let i = 0; i < checkList.length; i++) {
                const name = checkList[i]
                let info: WechatMiniprogram.Stats | null = await WXFile.getFileStat(`db/${this.path}/${name}`)
                if (info && info.size > 0) {
                    return true
                }
            }
            $g.log('[DBItem]校验文件失败')
        }
        return false
    }

    /** 删除文件夹下全部文件 */
    public async rmDir(): Promise<boolean> {
        const path: string = 'db/' + this.path
        $g.log(`[DBItem]删除 db 文件夹 ${path}`)
        return await WXFile.rmDir(path, true)
    }

    /** 获取现在可以导出的文件名 */
    public getFilePath(): string {
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

    /** 找到本地文件, 并打开 db */
    public async open(passPV: ProtectedValue) {
        await WXKeepScreen.on()
        // string | ArrayBuffer | null
        let readByte: any = null
        let filePath: string = `db/${this.path}/` + this.getFilePath()
        $g.log(`[DbItem][open]${filePath}`)
        if (this.pathMinIndex === 3 || this.pathMinIndex === 4) {
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

        if (readByte && $g.isTypeM(readByte, 'ArrayBuffer')) {
            const byte: any = readByte
            const db: Kdbx | null = await KdbxApi.open(byte, passPV.getText());
            if (db) {
                let savePass: boolean = false
                if (WXSoterAuth.facial && this.pass.facial === '') savePass = true
                if (WXSoterAuth.fingerPrint && this.pass.fingerPrint === '') savePass = true
                this.pass.pv = savePass ? KdbxApi.getPassPV(passPV.getText()) : null
                this.db = db
                // ----- 查询 db 中有没有附件, 有就对db进行拆解, 在保存
                if (this.pathMinIndex === 0) {
                    await this.getFileToDisk()
                }
            } else {
                wx.showToast({ title: '打开文件失败, 请检查密码!', icon: 'none', mask: false })
            }
        } else {
            $g.log('读取文件类型不符 : ', $g.className(readByte))
            wx.showToast({ title: '文件类型不符:' + $g.className(readByte), icon: 'none', mask: false })
        }
        await WXKeepScreen.off()
    }

    /** 保存 DbItem 到磁盘, 并且保存 DbLib 到 Storage */
    /**
     * DbItem (保存文件) DbLib (保存Storage) 
     * devtools 用 Base64 保存
     * 其他 用 二进制 保存
     */
    public async saveFileAddStorage() {
        if (this.db) {

            const byte: ArrayBuffer = await this.db.save()
            $g.log('[DbItem][saveFileAddStorage]', byte.byteLength)
            // const demo: GByteStream = new GByteStream(byte, true)
            // const n1: number = demo.rUint32()
            // const n2: number = demo.rUint32()
            // $g.log(`[DbItem][saveFileAddStorage]保存头部 n1 : ${n1} n2 : ${n2}`)
            if (byte && byte.byteLength > 0) {
                if ($g.g.systemInfo.brand === 'devtools') {
                    // 如果是开发者工具, 就存Base64, 因为二进制不稳定
                    const base64: string = ToolBytes.ArrayBufferToBase64(byte)
                    $g.log('[DbItem][saveFileAddStorage]base64:', base64.length)
                    if (this.pathMinIndex === 3) {
                        if (await WXFile.writeFile(`db/${this.path}/db.base64.2.txt`, base64)) {
                            this.pathMinIndex = 4
                        }
                    } else {
                        if (await WXFile.writeFile(`db/${this.path}/db.base64.1.txt`, base64)) {
                            this.pathMinIndex = 3
                        }
                    }
                } else {
                    if (this.pathMinIndex === 1) {
                        if (await WXFile.writeFile(`db/${this.path}/db.min.2.kdbx`, byte, 0, 'binary')) {
                            this.pathMinIndex = 2
                        }
                    } else {
                        if (await WXFile.writeFile(`db/${this.path}/db.min.1.kdbx`, byte, 0, 'binary')) {
                            this.pathMinIndex = 1
                        }
                    }
                }
                const lib: DBLib = $g.g.dbLib
                lib.storageSaveThis()
            }
        } else {
            $g.log('[DbItem][saveFileAddStorage] 失败, db空')
        }
    }

    /** 将里面的附件抽出, 并转换为文件存在本地 */
    public async getFileToDisk() {
        if (this.db) {
            const isChange: boolean = await this.getGroupToDisk(this.db.groups)
            if (isChange) {
                this.db.cleanup({
                    historyRules: true,// 删除额外的历史记录，它与定义的规则（例如记录编号）不匹配
                    customIcons: true,// 删除未使用的自定义图标
                    binaries: true// 删除未使用的二进制文件
                });
                this.db.cleanup({ binaries: true });
                await this.saveFileAddStorage()
            }
        }
    }

    /** 遍历组内的文件 */
    private async getGroupToDisk(groups: Group[]): Promise<boolean> {
        let l: number = groups.length
        let isChange: boolean = false
        if (l > 0) {
            for (let i = 0; i < groups.length; i++) {
                const group: Group = groups[i]
                if (await this.getGroupToDisk(group.groups)) {
                    isChange = true
                }
                if (await this.getEntrieToDisk(group.entries)) {
                    isChange = true
                }
            }
        }
        return isChange
    }

    /**
     * 查询出条目内的二进制文件, 并保存到文件夹下, 如果成功返回true,否则false
     * @param entries 
     */
    private async getEntrieToDisk(entries: Entry[]): Promise<boolean> {
        let isChange: boolean = false
        let l: number = entries.length
        if (l > 0) {
            for (let i = 0; i < entries.length; i++) {
                const entry: Entry = entries[i]
                const uuid: string = entry.uuid.toString()
                const binaries: any = entry.binaries
                // 获取 二进制文件 键值列表
                const fileList: Array<string> = Object.keys(binaries)
                // GKeyValue 的对象
                let gkv: any = {}
                if ($g.hasKey(entry.fields, 'GKeyValue')) {
                    const gkvJSON: any = entry.fields['GKeyValue']
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
                    const KdbxUuid: any = KdbxApi.kdbxweb.KdbxUuid
                    let pass: string = KdbxUuid.random().toString()
                    let byte: ArrayBuffer = fileInfo.value
                    // Aes
                    await AES.setKey(pass)
                    const aes: ArrayBuffer | null = await AES.encryptCBC(byte)
                    if (aes) {
                        byte = aes
                        // 文件名
                        const newPath: string = uuid + '_' + ref
                        const fileItem: any = {
                            name: fileName,
                            ref: ref,
                            path: newPath,
                            pass: pass,
                            size: byte.byteLength,
                            savetype: 'byte'
                        }
                        if ($g.g.systemInfo.brand === 'devtools') {
                            const base64: string = ToolBytes.ArrayBufferToBase64(byte)
                            await WXFile.writeFile(`db/${this.path}/${newPath}`, base64, 0, 'utf-8')
                            fileItem['savetype'] = 'base64'
                        } else {
                            await WXFile.writeFile(`db/${this.path}/${newPath}`, aes, 0, 'binary')
                        }
                        jsonFileList.push(fileItem)
                        delete binaries[fileName]
                        isChange = true
                    }
                }
                // 写入新的值
                entry.fields['GKeyValue'] = JSON.stringify(gkv)
                entry.removeHistory(0, entry.history.length)
                // $g.log('调整完毕 Entrie', entry)
            }
        }
        return isChange
    }

    __name__ = 'DBItem'
    /** 本数据对象需要保存的内容 */
    private static outList: Array<string> = ['localId', 'icon', 'name', 'filename', 'path', 'pathMinIndex', 'timeCreat', 'timeRead', 'timeChange', 'fileSizeAll', 'pass', 'tempFileList']
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