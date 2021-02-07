import { GFileSize } from "../lib/g-byte-file/g.file.size";
import { AppData } from "./data/app.data";

/**
 * 一个简单的入口
 * app 的引用
 * api 快速使用
 * log 日志管理
 * performance 性能分析
 * 用户操作记录
 * 
 * instanceof
 */
export class $g {

    /** app的引用 */
    public static a: IAppOption;
    public static g: IAppOption["globalData"];
    /** 本地缓存引用 */
    public static s: AppData;

    /** 初始化 */
    public static init(app: IAppOption): void {
        this.a = app;
        this.g = app.globalData;
        this.s = new AppData(app);
    }

    /** 返回全长类型 [object String] */
    public static type(o: any): string { return Object.prototype.toString.call(o) }
    /** 取出对象的[object Function], Function */
    public static typeM(o: any): string {
        const s: string = $g.type(o)
        if (s.length && s.substr(0, 8) === '[object ' && s.substr(-1, 1) === ']') {
            return s.substring(8, s.length - 1)
        }
        return s
    }
    /** 检查对象是否是 类似 : [object String] */
    public static isType(o: any, s: string): boolean { return $g.type(o) === s }
    /** 检查对象是否是 类似 : String */
    public static isTypeM(o: any, s: string): boolean { return $g.typeM(o) === s }
    /** 检查对象是否是 类似 : [String, Number] */
    public static isTypeMA(o: any, a: string[]): boolean { return a.indexOf($g.typeM(o)) !== -1 }
    /** 判断是否是基础数据, string, number, boolean */
    public static isBase(o: any): boolean { return $g.isTypeMA(o, ['String', 'Number', 'Boolean']) }
    /** 查看是否是字符串 */
    public static isString(o: any): boolean { return $g.typeM(o) === 'String'; }
    /** 查看是否是字符串 */
    public static isNumber(o: any): boolean { return $g.typeM(o) === 'Number'; }
    /** 查看是否是字符串 */
    public static isBoolean(o: any): boolean { return $g.typeM(o) === 'Boolean'; }
    /** 判断是否是 Array 类型 */
    public static isArray(o: any): boolean { return $g.typeM(o) === 'Array'; }
    /** 判断是否是 Object */
    public static isObject(o: any): boolean { return $g.typeM(o) === 'Object' && !$g.isArray(o); }
    /** 判断是否是 函数类型 */
    public static isFunction(o: any): boolean { return $g.typeM(o) === 'Function'; }
    /** 判断是否是 undefined */
    public static isUndefined(o: any): boolean { return o === undefined }
    // public static isUndefined(o: any): boolean { return typeof (o) === "undefined" }
    /** 判断是否是 null */
    public static isNull(o: any): boolean { return o === null }
    //public static isNull(o: any): boolean { return !o && o !== 0 && !$g.isUndefined(o) }
    /** 判断是否是 NaN 注:"/"等带特殊符号的也为true, NaN 是 [Object object] */
    public static isNaN(o: any): boolean { return isNaN(o) }


    /**
     * 校验 o 是不是 类 n
     * @param {any} o 要校验的对象
     * @param {String} n 类的名称
     */
    public static isClass(o: any, n: string): boolean {
        // if ($g.className(o) !== n) {
        //     $g.log('[G][isClass]' + $g.className(o) + ' ≠ ' + n)
        // }
        return $g.className(o) === n;
    }

    /**
     * 优先返回 : __name__
     * 值为Object : 有 prototype.name 返回, 无返回空
     * 没有检查基类
     * @param {*} o 
     */
    public static className(o: any): string {
        if (o) {
            if (o.__name__) return o.__name__;
            var m = $g.typeM(o)
            if (m === 'Object') {
                // 构建函数的属性
                if (o.prototype?.name) return o.prototype.name
                // 对象的属性
                if (o.__proto__?.__name__) return o.__proto__.__name__
                return m
            }
            return m
        }
        return ''
    }

    /**
     * 判断 o 是不是属于 c
     * @param o 对象
     * @param c 初始化类名
     */
    public static isType1111<T>(o: any, c: { new(): T; }): boolean {
        if (Object.prototype.toString.call(o) === Object.prototype.toString.call(new c())) return true;
        return false;
    }

    /**
     * 将对象 a → b 内容对象路径为 keys 部分内容复制到b的内容里, 返回获得的b
     * 1. a不存在、keys为空跳出, b不存在创建{}
     * 2. 进入 a及b 的keys目标, 中途 b 没有创建{}
     * 3. a 不存在 不会删除 b 属性
     * 4. 如果 * 全部拷贝, 直接对对象浅拷贝
     * 5. 如果 * 下有内容, 遍历a属性后浅拷贝
     * 
     * @param a 获取数据的对象
     * @param b 改变值的对象
     * @param keys user.jyj类似这样的路径, 空, 将遍历 a key 到 b
     * @param mode 模式*整个对象复制, ,号分割, ! 不拷贝的key
     */
    public static copyAB(a: any, b: any, keys: string = '', mode: string = '*'): any {
        let at: any,
            bt: any,
            atU: any, // 最终 keys 定位的对象
            btU: any, // 最终 keys 定位的对象
            k!: string;
        if (!a) return null
        if (!b) b = {}
        at = a;
        bt = b;
        // 是否在a的路径上找到 keys
        let finsh: boolean = true;
        let t_a: Array<string>;
        if (keys === '') {
            atU = a
            btU = b
            k = 'ok'
        } else {
            t_a = keys.split('.');
            for (k of t_a) {
                if ($g.hasKey(at, k)) {
                    atU = at;
                    btU = bt;
                    at = at[k];
                    if (!$g.hasKey(bt, k)) bt[k] = {};
                    bt = bt[k];
                } else {
                    finsh = false;
                }
            }
        }
        // 是否找到 keys 路径 ,  k 有表示已经进入过循环了
        if (finsh && !!k) {
            if (mode === '*') {
                btU[k] = atU[k];
            } else {
                t_a = mode.split(',');
                if (t_a.indexOf('*') !== -1) {
                    // 内部全拷, 找 非拷贝 项进行过滤
                    const list: Array<string> = Object.keys(at);
                    for (k of list) {
                        if (t_a.indexOf('!' + k) === -1) {
                            bt[k] = at[k];
                        }
                    }
                } else {
                    for (k of t_a) {
                        if (!!k && k.substr(0, 1) !== '!') {
                            if ($g.hasKey(at, k)) {
                                bt[k] = at[k];
                            }
                        }
                    }
                }
            }
        }
        return b;
    }

    /**
     * 检查对象是否包含某键值属性, 并返回值
     * @param o 检查对象
     * @param key 对象是否含 key 的属性
     */
    public static getKey(o: any, key: string = ''): any {
        if (key === '') return o
        if (o && !$g.isBase(o) && (o as Object).hasOwnProperty(key)) return o[key];
        return void 0;
    }

    /**
     * 检查对象是否包含某键值属性, 并检查不为空
     * @param o 检查对象
     * @param keys 对象是否含 key.key.key 的属性
     */
    public static getKeys(o: any, keys: string = ''): any {
        if (keys.indexOf('.') === -1) {
            return $g.getKey(o, keys)
        }
        if (o && !$g.isBase(o)) {
            const a: Array<string> = keys.split('.');
            let l: string = '';
            for (const key of a) {
                l = l + l.length ? '.' + key : key;
                if ($g.hasKey(o, key)) {
                    o = o[key];
                } else {
                    $g.log('getKeys 中断 : ' + l);
                    return void 0;
                }
            }
            return o;
        }
        return void 0;
    }

    /**
     * 检查对象是否包含某键值属性, 并检查不为空
     * @param o 检查对象
     * @param key 对象是否含 key 的属性
     * @param checkValue 是String是否检查长度大于1, Number != 0
     */
    public static hasKey(o: any, key?: string): boolean {
        if (o && !!key && !$g.isBase(o) && (o as Object).hasOwnProperty(key)) {
            // if (checkValue) {
            //     const v: any = o[key];
            //     switch ($g.typeM(v)) {
            //         case 'String':
            //             return !!v;
            //         /*
            //         上面的 checkValue false比较好, 否则不知道会产生什么后果
            //         case 'Number':
            //             return v !== 0;
            //         */
            //     }
            // }
            return true;
        }
        return false;
    }

    /**
     * 检查对象是否包含某键值属性, 并检查不为空
     * @param o 检查对象
     * @param keys 对象是否含 key.key.key 的属性
     * @param checkValue 如果是String是否检查长度大于1
     */
    public static hasKeys(o: any, keys?: string): boolean {
        if (o && !!keys && !$g.isBase(o)) {
            const a: Array<string> = keys.split('.');
            let l: string = '';
            for (const key of a) {
                l = l + l.length ? '.' + key : key;
                if ($g.hasKey(o, key)) {
                    o = o[key];
                } else {
                    $g.log('hasKeys 中断 : ' + l);
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    /** 日志里用的数组 */
    private static logArray: Array<any> = new Array<any>();
    /** 如果有值在日志后接着在打印一条 */
    private static logAdd: string = ''

    //日志, 开发者工具 → Blackboxing → /speed.do\.ts$ */
    /**
     * 
     * 步骤记录
     * 添加回调, g|step|name|method, 函数(stepIndex:number, stepInfo:string, allTime:number开始到现在的毫秒, nextTime:number和上一步的毫秒)
     * 开启步骤, g|step|name|start 开始记录步骤
     * 记录步骤, g|step|name|record 添加记录步骤
     * 结束步骤, g|step|name|end 开始记录步骤
     */
    public static log(...args: any[]): void {
        try {
            if ($g.g.app.DEBUG) {
                $g.logArray.length = 0
                $g.logSuper(args)
                $g.logDisplay(args)
                if ($g.logAdd) console.log($g.logAdd)
            }
        } catch (e) {
            console.error('console.log error', e);
        }
    }

    /** 开始计时 */
    private static logTime: number = 0;
    /** 给下一条日志用的时间间隔 */
    private static logTimeNext: number = 0;

    /**
     * 日志加强处理
     * @param args 日志参数
     */
    private static logSuper(args: any[]): void {
        $g.logSuperTime(args)
    }

    /**
     * 时间 :|000.000 后面是时间位数(秒.毫秒)
     * 时间输出, g|time|start  开始时间检测   ┏━━┳━━┓
     * 时间输出, g|time|end    结束时间检测  ┃┗━━┻━━┛
     */
    private static logSuperTime(args: any[]): void {
        let s: string = '',
            n1: number = 0,
            n2: number = 0,
            n3: number = 0,
            t1: string = '',// 总共经过的时间
            t2: string = '' // 和上一条日志之间的间隔
        if ($g.logTime) {
            n2 = $g.logTimeNext
            $g.logTimeNext = new Date().getTime()
            n1 = $g.logTimeNext - $g.logTime
            n3 = $g.logTimeNext - n2
            t1 = n1.toString().substr(-6, 6)
            t2 = n3.toString().substr(-6, 6)
            while (t1.length < 6) {
                t1 = '0' + t1
            }
            while (t2.length < 6) {
                t2 = '0' + t2
            }
            t1 = '[' + t1.substr(-6, 3) + '.' + t1.substr(-3, 3) + '|'
            t1 += t2.substr(-6, 3) + '.' + t2.substr(-3, 3) + ']'
        }
        if (args.length > 0 && $g.isString(args[0])) {
            s = args[0]
            switch (s) {
                case 'g|time|start':
                    $g.logTime = new Date().getTime()
                    $g.logTimeNext = $g.logTime
                    if (t1) console.log(t1 + 'TimeEnd');
                    args[0] = '[000.000|000.000][TimeStart]'
                    break;
                case 'g|time|end':
                    t1 += '[TimeEnd]'
                    $g.logTime = 0
                    args.shift()
                    break;
            }
        }
        if (t1) $g.logArray.push(t1)
    }


    /**
     * 递归日志内容, 优化处理结果
     * @param args 日志是参数
     */
    private static logDisplay(args: any[]): void {
        for (let i = 0; i < args.length; i++) {
            const item: any = args[i]
            const type: string = $g.className(item)
            switch (type) {
                // 二进制处理
                case 'Int8Array':
                case 'Int16Array':
                case 'Int32Array':
                case 'Uint8Array':
                case 'Uint16Array':
                case 'Uint32Array':
                case 'DataView':
                case 'ArrayBuffer':
                    $g.logDisplayByte(type, item)
                    break;
                // 其他类型
                default:
                    $g.logArray.push(item)
            }
        }
        if ($g.logArray.length) console.log(...$g.logArray);
    }

    /**
     * 日志的二进制处理机制
     * [ArrayBuffer 16M 978923972..(8个)...... : 对象]
     * @param args 
     */
    private static logDisplayByte(type: string, item: any): void {
        let arraybuffer: ArrayBuffer,
            s: string = ''
        if (type === 'ArrayBuffer') {
            arraybuffer = item
        } else {
            arraybuffer = item.buffer
        }
        const dv: DataView = new DataView(arraybuffer)
        const l: number = arraybuffer.byteLength
        s = '[ArrayBuffer ' + GFileSize.getSize(l, 3) + ' '
        let m: number = 0
        while (m < l) {
            if (m !== 0) s += ','
            if (l - m > 3) {
                s += dv.getInt32(m, false).toString()
                m += 4
            } else {
                s += 'U8(' + dv.getUint8(m).toString() + ')'
                m += 1
            }
            if (m === l) {
                s += ' End'
            } else if (m > 32) {
                s += '......'
                break
            }
        }
        s += ' : '
        $g.logArray.push(s)
        $g.logArray.push(item)
        $g.logArray.push(']')
    }
}