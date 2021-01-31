import { DBBase } from "./db.base"

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