import { AES } from "../../frame/crypto/AES"
import { $g } from "../../frame/speed.do"
import { ToolBytes } from "../../frame/tools/tool.bytes"
import { WXFile, WXFileStats } from "../../frame/wx/wx.file"
import { Entry, Group, Kdbx } from "../kdbxweb/types"
import { DBItem } from "./db"
import { DBEntryApi } from "./db.entry.api"
import { KdbxApi } from "./kdbx.api"

/**
 * 检测处理 DBItem
 */
export class DBItemCheckApi {

    /**
     * 检查 DBItem 的文件夹, 返回是否拥有 kdbx 数据库
     * 1. 统计出 entry 数量
     * 2. 统计出 group 数量
     * 3. 统计出 文件夹尺寸
     * 4. 统计出 Kdbx 尺寸
     * 5. 统计出 UUID Path 路径
     * 6. 统计出 ref 附件列表
     * 7. 统计出 回收站 ref 附件列表(如果在非回收站出现过会被排除)
     * 
     * @param dbItem 
     */
    public static async check(dbItem: DBItem): Promise<boolean> {
        let dbPath: string = dbItem.path ? dbItem.path : dbItem.localId.toString()
        if (dbPath) {
            let checkDb: boolean = false
            if (dbItem.db) {
                const kdbx: Kdbx = dbItem.db
                kdbx.cleanup({
                    historyRules: true, // 删除额外的历史记录，它与定义的规则（例如记录编号）不匹配
                    customIcons: true,  // 删除未使用的自定义图标
                    binaries: true      // 删除未使用的二进制文件
                })
                kdbx.cleanup({ binaries: true })
                const groups: Group[] = kdbx.groups
                dbItem.count.entry = 0
                dbItem.count.entryRecycle = 0
                dbItem.count.group = 0
                dbItem.count.groupRecycle = 0
                dbItem.entryUUIDgkv = {}
                dbItem.groupMaxLevel = 0
                dbItem.entryUUIDPath.clear()
                dbItem.refLib.clear()
                dbItem.refRecycleLib.clear()
                dbItem.refHistoryLib.clear()
                // 设置垃圾桶的UUID
                if (kdbx.meta) {
                    const meta: any = kdbx.meta
                    if (meta.recycleBinUuid && meta.recycleBinUuid.id) {
                        dbItem.recycleUUID = meta.recycleBinUuid.id
                    }
                }
                // 默认其实 groups 就只有一个对象
                const groupsLen: number = groups.length
                if (groupsLen) {
                    for (let i = 0; i < groupsLen; i++) {
                        await DBItemCheckApi.checkGroup(dbItem, groups[i], 0, false)
                    }
                }
                checkDb = true
            }
            // ----------------开始检查无用的文件, 并清理
            dbPath = `${wx.env.USER_DATA_PATH}/db/${dbPath}`
            const pathLen: number = dbPath.length
            const stat: WXFileStats | WXFileStats[] | null = await WXFile.getStat(dbPath, true, false)
            if (stat) {
                const statAny: any = stat
                let sizeFolder: number = 0
                let sizeKdbxByte: number = 0
                let hasDb: boolean = false
                if ($g.isArray(stat)) {
                    const statList: WXFileStats[] = statAny
                    // $g.log('递归处理无用文件:---------------', dbPath)
                    for (let i = 0; i < statList.length; i++) {
                        const item: WXFileStats = statList[i]
                        // $g.log('递归处理无用文件:', item)
                        // 检查 db.kdbx 是否已经用过, 用过就删除
                        if (dbItem.pathMinIndex !== 0 && item.path === '/db.kdbx') {
                            if (await WXFile.delFile(item.path)) {
                                $g.log('清理原始文件:', item.path)
                            }
                        } else {
                            if (!hasDb && !item.isDirectory && item.size > 0) {
                                let dbPath: string = item.path
                                if (dbPath.substr(0, 1) === '/') dbPath = dbPath.substr(1)
                                if (DBItem.DBRightName.has(dbPath)) hasDb = true
                            }
                            // 如果已经缓存了整个 DB 情况, 就进行垃圾文件处理
                            if (checkDb) {
                                let checkPath: string = item.path
                                if (checkPath.substr(0, 1) === '/') checkPath = checkPath.substr(1)
                                let pathArr: Array<string> = checkPath.split('/')
                                if (item.path === '/') {
                                    // 根目录不要动
                                } else if (pathArr.length === 1) {
                                    checkPath = pathArr[0]
                                    if (DBItem.DBRightName.has(checkPath)) {
                                        // 数据库文件 不用管
                                        sizeFolder += item.size
                                        sizeKdbxByte += item.size
                                    } else if (item.isDirectory) {
                                        // 如果 UUIDPath 里已经没有文件夹就删除
                                        if (!dbItem.entryUUIDPath.has(checkPath)) {
                                            await WXFile.rmDir(`${dbPath}${item.path}`, true, false)
                                            $g.g.app.DEBUG && $g.log('[DBItemCheckApi.check]删除:', item.path)
                                        }
                                    } else {
                                        await WXFile.delFile(`${dbPath}${item.path}`, false)
                                    }
                                } else if (pathArr.length === 2) {
                                    // checkPath = pathArr[1]
                                    // const ref: string = checkPath.split('.')[0]
                                    // 文件夹已在 checkEntry 清理
                                    // 只要在合法文件夹下就可以
                                    checkPath = pathArr[0]
                                    if (dbItem.entryUUIDPath.has(checkPath)) {
                                        sizeFolder += item.size
                                    }
                                } else {
                                    // 如果目录超过2个目录就删除
                                    if (item.isDirectory) {
                                        await WXFile.rmDir(`${dbPath}${item.path}`, true, false)
                                        $g.g.app.DEBUG && $g.log('[DBItemCheckApi.check]删除:', item.path)
                                    } else {
                                        await WXFile.delFile(`${dbPath}${item.path}`, false)
                                        $g.g.app.DEBUG && $g.log('[DBItemCheckApi.check]删除:', item.path)
                                    }
                                }
                            } else {
                                sizeFolder = sizeFolder + item.size
                            }
                        }
                    }
                } else {
                    $g.g.app.DEBUG && $g.log('[DBItemCheckApi.check]文件不应出现')
                }
                dbItem.count.sizeFolder = sizeFolder
                dbItem.count.sizeKdbxByte = sizeKdbxByte
                return hasDb
            }
        }
        return false
    }

    /**
     * 查询全部的文件部分, 生成 ref 列表
     * @param group 查询的 Group
     * @param recursion 是否递归下面的全部 group
     * @param findHistory 是否查询历史记录
     * @param clearPath 是否清除没用的文件(findHistory === true) 才生效, 传入 dbItem.path
     * @param addSet 是否连接到 Set 上
     */
    private static async checkGroup(dbItem: DBItem, group: Group, level: number, recycle: boolean): Promise<any> {
        let entryLen: number = group.entries.length
        if (entryLen) {
            // 回收站不统计组层级, 否则统计组层级
            if (!recycle && dbItem.groupMaxLevel < level) dbItem.groupMaxLevel = level
            // 统计出条目数量
            if (recycle) {
                dbItem.count.entryRecycle += entryLen
            } else {
                dbItem.count.entry += entryLen
            }
            // 处理条目
            for (let i = 0; i < entryLen; i++) {
                const entry: Entry = group.entries[i]
                await DBItemCheckApi.checkEntry(dbItem, entry, recycle)
            }
        }
        const groupsLen: number = group.groups.length
        if (groupsLen) {
            // 统计出组数量
            if (recycle) {
                dbItem.count.groupRecycle += groupsLen
            } else {
                dbItem.count.group += groupsLen
            }
            // 递归组内容
            for (let i = 0; i < groupsLen; i++) {
                const item: Group = group.groups[i]
                if (item.uuid.id === dbItem.recycleUUID) {
                    await DBItemCheckApi.checkGroup(dbItem, item, ++level, true)
                } else {
                    await DBItemCheckApi.checkGroup(dbItem, item, ++level, recycle)
                }
            }
        }
        return void 0
    }

    /**
     * 查询全部的文件部分, 生成 ref 列表
     * @param dbItem 查询的对象
     * @param findHistory 是否查找历史记录内的内容
     * @param clearPath 是否清除没用的文件(findHistory === true) 才生效, 传入 dbItem.path
     */
    private static async checkEntry(dbItem: DBItem, entry: Entry, recycle: boolean): Promise<any> {
        // 加入 UUIDPath 列表
        let uuid: string = ''
        if (entry.uuid && entry.uuid.id) uuid = entry.uuid.id
        let uuidPath: string = KdbxApi.uuidPath(entry.uuid)
        dbItem.entryUUIDPath.add(uuidPath)
        // 缓存 gkv 对象
        let gkv: any;
        if ($g.hasKey(dbItem.entryUUIDgkv, uuid)) {
            gkv = dbItem.entryUUIDgkv.uuid
        } else {
            if ($g.hasKey(entry.fields, 'GKeyValue')) {
                const json: any = entry.fields.GKeyValue
                gkv = JSON.parse(json)
            } else {
                gkv = {}
            }
            dbItem.entryUUIDgkv.uuid = gkv
        }
        // 获取 GKV 文件列表
        let filelist: Array<any> = new Array<any>()
        if ($g.hasKey(gkv, 'filelist')) filelist = gkv.filelist
        gkv.filelist = filelist
        // 查询源文件 binaries 有就缓存
        const binaries: any = entry.binaries
        const fileKey: Array<string> = Object.keys(binaries)
        if (fileKey.length) {
            const KdbxUuid: any = KdbxApi.kdbxweb.KdbxUuid
            for (let j = 0; j < fileKey.length; j++) {
                // this.getGroupToDiskTotle++
                // if ($g.step.index < $g.step.list.length) {
                //     $g.step.list[$g.step.index].title = this.getGroupToDiskStr + ',序号:' + this.getGroupToDiskTotle + ' (读取)'
                //     await $g.step.runMethod()
                // }
                const fileName: string = fileKey[j]
                const fileInfo: any = binaries[fileName]
                const ref: string = fileInfo.ref
                const pass: string = KdbxUuid.random().toString()
                const byte: ArrayBuffer = fileInfo.value
                // if ($g.step.index < $g.step.list.length) {
                //     $g.step.list[$g.step.index].title = this.getGroupToDiskStr + ',序号:' + this.getGroupToDiskTotle + ' (加密)'
                //     await $g.step.runMethod()
                // }
                const aesObj: AES = new AES()
                await aesObj.setKey(pass)
                const aes: ArrayBuffer | null = await aesObj.encryptCBC(byte)
                if (aes) {
                    // 文件名
                    const newPath: string = `db/${dbItem.path}/${uuidPath}/${ref}`
                    const fileItem: any = {
                        name: fileName,         // 文件添加的时候的名称, 包含扩展名
                        ref: ref,               // 整个路径 uuid + '.' + ref
                        pass: pass,             // AES 加密的密码
                        size: byte.byteLength,  // 加密前的长度
                        savetype: 'byte'        // base64 byte binaries
                    }
                    // if ($g.step.index < $g.step.list.length) {
                    //     $g.step.list[$g.step.index].title = this.getGroupToDiskStr + ',序号:' + this.getGroupToDiskTotle + ' (存储)'
                    //     await $g.step.runMethod()
                    // }
                    if ($g.g.systemInfo.brand === 'devtools') {
                        const base64: string = ToolBytes.ArrayBufferToBase64(aes)
                        await WXFile.writeFile(newPath + '.aes', base64, 0, 'utf-8')
                        fileItem['savetype'] = 'base64'
                    } else {
                        await WXFile.writeFile(newPath + '.aes', aes, 0, 'binary')
                    }
                    $g.log('原始图:', newPath + '.aes')
                    await DBEntryApi.mackEntryIcon(fileName, newPath, ref, byte, pass, fileItem)
                    filelist.push(fileItem)
                    delete binaries[fileName]
                    dbItem.changeDB = true
                }
            }
        }
        // 缓存 附件列表
        const entryREF: Set<string> = new Set<string>()
        const historyREF: Set<string> = new Set<string>()
        if (filelist.length) {
            for (let i = 0; i < filelist.length; i++) {
                const item: any = filelist[i]
                entryREF.add(item.ref)
                if (recycle) {
                    // 回收站内, 如果没有在正常和历史记录出现就缓存
                    if (!dbItem.refLib.has(item.ref) && !dbItem.refHistoryLib.has(item.ref)) {
                        dbItem.refRecycleLib.add(item.ref)
                    }
                } else {
                    // 缓存列表
                    dbItem.refLib.add(item.ref)
                    dbItem.refHistoryLib.delete(item.ref)
                    dbItem.refRecycleLib.delete(item.ref)
                }
            }
        }
        // 处理 历史记录
        const hLen: number = entry.history.length
        if (hLen) {
            for (let i = 0; i < hLen; i++) {
                const h: Entry = entry.history[i]
                // 清空历史记录二进制内容
                const hb: any = h.binaries
                const hbList: Array<string> = Object.keys(hb)
                for (let j = 0; j < hbList.length; j++) {
                    const file: string = hbList[j]
                    delete hb[file]
                    dbItem.changeDB = true
                }
                let hGKV: any = null;
                if ($g.hasKey(h.fields, 'GKeyValue')) {
                    const json: any = h.fields.GKeyValue
                    hGKV = JSON.parse(json)
                }
                // 处理历史记录的为文件
                if (hGKV && $g.hasKey(hGKV, 'filelist')) {
                    const list: [] = hGKV['filelist']
                    for (let i = 0; i < list.length; i++) {
                        const item: any = list[i]
                        if (!entryREF.has(item.ref)) {
                            historyREF.add(item.ref)
                        }
                        // 历史记录里找到 ref
                        if (!dbItem.refLib.has(item.ref) && !dbItem.refHistoryLib.has(item.ref)) {
                            if (recycle) {
                                dbItem.refRecycleLib.add(item.ref)
                            } else {
                                dbItem.refHistoryLib.add(item.ref)
                            }
                        }
                    }
                }
            }
        }
        // 开始清理文件 entryREF historyREF 都不包含就删除
        if (uuidPath) {
            const pathHand: string = `${wx.env.USER_DATA_PATH}/db/${dbItem.path}/${uuidPath}`
            const stat: WXFileStats | WXFileStats[] | null = await WXFile.getStat(pathHand, true, false)
            if (stat) {
                const statAny: any = stat
                if ($g.isArray(stat)) {
                    const list: WXFileStats[] = statAny
                    for (let i = 0; i < list.length; i++) {
                        const file: WXFileStats = list[i]
                        if (!file.isDirectory) {
                            let path: string = file.path
                            if (path.substr(0, 1) === '/') path = path.substr(1)
                            let ref: string = path.split('.')[0]
                            if (!entryREF.has(ref) && !historyREF.has(ref)) {
                                if (await WXFile.delFile(`${pathHand}/${file.path}`)) {
                                    $g.g.app.DEBUG && $g.log('[DBItemCheckApi.checkEntry]删除成功', `${pathHand}/${file.path}`, ' REF:', ref)
                                } else {
                                    $g.g.app.DEBUG && $g.log('[DBItemCheckApi.checkEntry]删除失败', `${pathHand}/${file.path}`, ' REF:', ref)
                                }
                            }
                        }
                    }
                } else {
                    $g.g.app.DEBUG && $g.log('[DBItemCheckApi.checkEntry]文件不应出现')
                }
            }
        }
        return void 0
    }

}