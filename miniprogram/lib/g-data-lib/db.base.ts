import { $g } from "../../frame/speed.do"
import { DBLib } from "./db.lib"
import { DBItem } from "./db.item"
import { DbLog } from "./db.log"

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
            DBBase.classTarget.push(DBLib, DBItem, DbLog)
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