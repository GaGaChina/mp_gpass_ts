import { $g } from "../../frame/speed.do";
import { KdbxWeb, Kdbx, ProtectedValue, Credentials, Group, KdbxUuid } from "../kdbxweb/types/index";

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
        return db
    }

    /**
     * 载入二进制,并通过密码获取Kdbx数据库
     * @param byte 原始的二进制
     * @param pass 文本密码
     */
    public static async open(byte: ArrayBuffer, pass: string): Promise<Kdbx> {
        const credentials: Credentials = KdbxApi.getPassCredentials(pass)
        return await (KdbxApi.kdbxweb.Kdbx as any).load(byte, credentials) as Kdbx
    }

    /**
     * 保存数据库
     * @param db Kdbx对象
     */
    public static async save(db: Kdbx): Promise<ArrayBuffer> {
        db.groups[0].entries[0].times.creationTime
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