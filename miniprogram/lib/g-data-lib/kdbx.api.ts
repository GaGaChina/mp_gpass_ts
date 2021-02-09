import { $g } from "../../frame/speed.do";
import { GFileSize } from "../g-byte-file/g.file.size";
import { KdbxWeb, Kdbx, ProtectedValue, Credentials, Group, Entry } from "../kdbxweb/types/index";

const KdbxWeb = require('./../kdbxweb/index')

export class KdbxApi {

    public static kdbxweb: KdbxWeb = KdbxWeb as KdbxWeb

    /** 通过密码, 获取加盐存储密码 */
    public static getPassPV(pass: String): ProtectedValue {
        const pvObj: any = KdbxApi.kdbxweb.ProtectedValue
        const pv: ProtectedValue = pvObj.fromString(pass)
        return pv
    }


    /**
     * 通过文本获取密码对象
     * @param pass 文本密码
     */
    public static getPassCredentials(pass: String): Credentials {
        const pv: ProtectedValue = KdbxApi.getPassPV(pass)
        const n: any = KdbxApi.kdbxweb.Credentials
        const o: Credentials = new n(pv)
        return o
    }

    /**
     * 创建一个新的数据库
     * @param name 密码库名称
     * @param pass 密码
     */
    public static create(name: string, pass: string): Kdbx {
        const c: Credentials = KdbxApi.getPassCredentials(pass)
        const kdbx:any = KdbxApi.kdbxweb.Kdbx
        const db: Kdbx = kdbx.create(c, name)
        //db.set({ active: true, created: true, name });
        const dbHeader: any = db.header
        dbHeader.setKdf(KdbxApi.kdbxweb.Consts.KdfId.Aes)
        return db
    }

    /**
     * 载入二进制,并通过密码获取Kdbx数据库
     * @param byte 原始的二进制
     * @param pass 文本密码
     */
    public static async open(byte: ArrayBuffer, pass: string): Promise<Kdbx | null> {
        // try {
        $g.log('g|time|start')
        $g.log('[KdbxApi][open]文件长度 : ' + GFileSize.getSize(byte.byteLength, 3))
        const c: Credentials = KdbxApi.getPassCredentials(pass)
        const a: ArrayBuffer = await c.getHash()
        // $g.log('[KdbxApi][open]credentials', a);
        // $g.log('[KdbxApi][open]证书创建成功', credentials)
        const kdbx: any = KdbxApi.kdbxweb.Kdbx
        const db: Kdbx | null = await kdbx.load(byte, c)
        $g.log('g|time|end')
        return db
        // } catch (e) {
        //     $g.log('[KdbxApi][open][error]', e)
        //     $g.log('g|time|end')
        //     return Promise.resolve(null);
        // }
    }

    /**
     * 保存数据库
     * @param db Kdbx对象
     */
    public static async save(db: Kdbx): Promise<ArrayBuffer> {
        $g.log('[KdbxApi]save')
        return await db.save()
    }

    /**
     * 查看这个文件是否是新的, 没有新条目
     * @param db Kdbx对象
     */
    public static isEmpty(db: Kdbx): boolean {
        if (db) {
            if (db.groups.length > 1) return false
            if (db.groups.length > 0) {
                const group: Group = db.groups[0]
                return KdbxApi.isGroupEmpty(group)
            }
        }
        return true
    }

    /**
     * 递归查询group和以下内容是否都是空
     * @param group 
     */
    public static isGroupEmpty(group: Group): boolean {
        if (group) {
            if (group.groups.length > 1) return false
            if (group.groups.length > 0) {
                const next: Group = group.groups[0]
                return KdbxApi.isGroupEmpty(next)
            }
        }
        return true
    }

    /**
     * 在 Group 中查找 uuid 对象
     * @param group 
     * @param uuid 
     */
    public static findUUID(group: Group, uuid: string): Group | Entry | null {
        if (group) {
            if (group.uuid.id === uuid) {
                return group
            } else {
                let out: any | null = null
                let l: number = group.groups.length
                for (let i = 0; i < l; i++) {
                    const groupItem: Group = group.groups[i];
                    // if(groupItem.uuid.id === uuid){
                    //     return groupItem
                    // }
                    out = this.findUUID(groupItem, uuid)
                    if (out) {
                        return out
                    }
                }
                l = group.entries.length
                for (let i = 0; i < l; i++) {
                    const entrieItem = group.entries[i];
                    if (entrieItem.uuid.id === uuid) {
                        return entrieItem
                    }
                }
            }
        }
        return null
    }

    /**
     * 在 Group 中查找 uuid 对象
     * @param group 
     * @param uuid 
     */
    public static findUUIDGroup(group: Group, uuid: string): Group | null {
        if (group) {
            if (group.uuid.id === uuid) {
                return group
            } else {
                let out: any | null = null
                let l: number = group.groups.length
                for (let i = 0; i < l; i++) {
                    const groupItem: Group = group.groups[i];
                    out = this.findUUID(groupItem, uuid)
                    if (out) {
                        return out
                    }
                }
            }
        }
        return null
    }
}