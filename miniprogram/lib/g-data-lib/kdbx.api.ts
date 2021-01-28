import { $g } from "../../frame/speed.do";
import { GFileSize } from "../g-byte-file/g.file.size";
import { KdbxWeb, Kdbx, ProtectedValue, Credentials, Group, KdbxUuid } from "../kdbxweb/types/index";


const Consts = require('./../kdbxweb/defs/consts')
const KdbxWeb = require('./../kdbxweb/index.js')

export class KdbxApi {

    public static kdbxweb: KdbxWeb = KdbxWeb as KdbxWeb

    /**
     * 通过文本获取密码对象
     * @param pass 文本密码
     */
    public static getPassCredentials(pass: String): Credentials {
        const passPV: ProtectedValue = (KdbxApi.kdbxweb.ProtectedValue as any).fromString(pass);
        const CredentialsClass: any = KdbxApi.kdbxweb.Credentials
        const credentials: Credentials = new CredentialsClass(passPV)
        return credentials
    }
    
    /**
     * 创建一个新的数据库
     * @param name 密码库名称
     * @param pass 密码
     */
    public static create(name: string, pass: string): Kdbx {
        const credentials: Credentials = KdbxApi.getPassCredentials(pass)
        const db: Kdbx = (KdbxApi.kdbxweb.Kdbx as any).create(credentials, name)
        //db.set({ active: true, created: true, name });
        const dbHeader:any = db.header
        dbHeader.setKdf(Consts.KdfId.Aes)
        return db
    }

    /**
     * 载入二进制,并通过密码获取Kdbx数据库
     * @param byte 原始的二进制
     * @param pass 文本密码
     */
    public static async open(byte: ArrayBuffer, pass: string): Promise<Kdbx | null> {
        try {
            $g.log('g|time|start')
            $g.log('[KdbxApi][open]文件长度 : ' + GFileSize.getSize(byte.byteLength, 3))
            const credentials: Credentials = KdbxApi.getPassCredentials(pass)
            const a:ArrayBuffer = await credentials.getHash()
            // $g.log('[KdbxApi][open]credentials', a);
            // $g.log('[KdbxApi][open]证书创建成功', credentials)
            const db:Kdbx | null = await (KdbxApi.kdbxweb.Kdbx as any).load(byte, credentials) as Kdbx
            $g.log('g|time|end')
            return db
        } catch (e) {
            $g.log('[KdbxApi][open][error]', e)
            $g.log('g|time|end')
            return Promise.resolve(null);
        }
    }

    /**
     * 保存数据库
     * @param db Kdbx对象
     */
    public static async save(db: Kdbx): Promise<ArrayBuffer> {
        return db.save()
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


}