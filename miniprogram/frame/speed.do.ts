import { GFileSize } from "../lib/g-byte-file/g.file.size";
import { Times } from "../lib/kdbxweb/types";
import { DataApp } from "./data/data.app";

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
    public static s: DataApp;

    /** 初始化 */
    public static init(app: IAppOption): void {
        this.a = app;
        this.g = app.globalData;
        this.s = new DataApp(app);
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
    /** 判断是否是函数类型 */
    public static isArray(o: any): boolean { return $g.typeM(o) === 'Array'; }
    /** 判断是否是Object */
    public static isObject(o: any): boolean { return $g.typeM(o) === 'Object' && !$g.isArray(o); }
    /** 判断是否是函数类型 */
    public static isFunction(o: any): boolean { return $g.typeM(o) === 'Function'; }
    /**
     * 校验 o 是不是 类 n
     * @param {any} o 要校验的对象
     * @param {String} n 类的名称
     */
    public static isClass(o: any, n: string): boolean {
        if ($g.className(o) !== n) {
            $g.log('[G][isClass]' + $g.className(o) + ' ≠ ' + n)
        }
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
     * 将对象 a -> b 复制到b的内容里, 返回获得的b
     * 1. a不存在、keys为空跳出, b不存在创建{}
     * 2. 进入 a及b 的keys目标, 中途 b 没有创建{}
     * 3. a 不存在 不会删除 b 属性
     * 4. 如果 * 全部拷贝, 直接对对象浅拷贝
     * 5. 如果 * 下有内容, 遍历a属性后浅拷贝
     * 
     * @param a 获取数据的对象
     * @param b 改变值的对象
     * @param keys user.jyj类似这样的路径
     * @param mode 模式*整个对象复制, ,号分割, ! 不拷贝的key
     */
    public static copyAB(a: any, b: any, keys: string, mode: string = '*'): any {
        let at: any, bt: any, atU: any, btU: any, k!: string;
        if (!keys || !a) return;
        if (!b) b = {};
        at = a;
        bt = b;
        let finsh: boolean = true;
        let t_a: Array<string> = keys.split('.');
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
        if (finsh && !!k) {
            if (mode === '*') {
                btU[k] = atU[k];
            } else {
                t_a = mode.split(',');
                if (t_a.indexOf('*') !== -1) {
                    //循环内部变量
                    const list: Array<string> = Object.keys(at);
                    for (k of list) {
                        if (t_a.indexOf('!' + k) === -1) {
                            bt[k] = at[k];
                        }
                    }
                } else {
                    for (k of t_a) {
                        if (!!k && k.substr(0, 1) !== '!') {
                            if ($g.hasKey(at, k, false)) {
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
    public static getKey(o: any, key?: string): any {
        if (o && !!key && !$g.isBase(o) && (o as Object).hasOwnProperty(key)) {
            return o[key];
        }
        return void 0;
    }

    /**
     * 检查对象是否包含某键值属性, 并检查不为空
     * @param o 检查对象
     * @param keys 对象是否含 key.key.key 的属性
     */
    public static getKeys(o: any, keys?: string): any {
        if (o && !!keys && !$g.isBase(o)) {
            const a: Array<string> = keys.split('.');
            let l: string = '';
            for (const key of a) {
                l = l + l.length ? '.' + key : key;
                if ($g.hasKey(o, key)) {
                    o = o[key];
                } else {
                    //$g.log('checkObjKeys 属性中断于 : ' + l);
                    console.log('getObjKeys 属性中断于 : ' + l);
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
    public static hasKey(o: any, key?: string, checkValue: boolean = true): boolean {
        if (o && !!key && !$g.isBase(o) && (o as Object).hasOwnProperty(key)) {
            if (checkValue) {
                const v: any = o[key];
                switch (Object.prototype.toString.call(v)) {
                    case '[object String]':
                        return !!v;
                    /*
                    上面的 checkValue false比较好, 否则不知道会产生什么后果
                    case '[object Number]':
                        return v !== 0;
                    */
                }
            }
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
    public static hasKeys(o: any, keys?: string, checkValue: boolean = true): boolean {
        if (o && !!keys && !$g.isBase(o)) {
            const a: Array<string> = keys.split('.');
            let l: string = '';
            for (const key of a) {
                l = l + l.length ? '.' + key : key;
                if ($g.hasKey(o, key, checkValue)) {
                    o = o[key];
                } else {
                    //$g.log('checkObjKeys 属性中断于 : ' + l);
                    console.log('checkObjKeys 属性中断于 : ' + l);
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    /** 开始计时 */
    private static logTime: number = 0;

    //日志, 开发者工具 → Blackboxing → /speed.do\.ts$ */
    /**
     * 时间 :|000.000 后面是时间位数(秒.毫秒)
     * 时间输出, g|time|start  开始时间检测   ┏━━┓
     * 时间输出, g|time|end    结束时间检测  ┃┗━━┛
     */
    public static log(...args: any[]): void {
        try {
            if ($g.g.app.DEBUG) {
                /*
                const a: Array<any> = [].slice.call(args);
                if (a.length === 1 && $g.isBase(a[0])) {
                    //background:#000000;color:#FFFFFF
                    let o: string = '[' + ToolTime.getTimesString(new Date()) + ']';
                    console.log(o + a[0].toString());
                } else {
                    console.log(...args);
                }
                */
                let s: string = '',
                    n: number = 0,
                    b: boolean = false,
                    endString: string = '',
                    timeString: string = ''
                if ($g.logTime) {
                    n = new Date().getTime() - $g.logTime
                    timeString = n.toString().substr(-6, 6)
                    while (timeString.length < 6) {
                        timeString = ' ' + timeString
                    }
                    timeString = '┃' + timeString.substr(-6, 3) + '.' + timeString.substr(-3, 3) + '┃'
                }
                if (args.length > 0 && $g.isString(args[0]) && args[0].substr(0, 2) === 'g|') {
                    s = args[0]
                    if (s.substr(2, 10) === 'time|start') {
                        $g.logTime = new Date().getTime()
                        if (timeString) console.log(timeString + 'TimeEnd');
                        console.log('┏━━━━━━━┓TimeStart');
                        s = s.substr(12)
                        b = true
                    } else if (s.substr(2, 8) === 'time|end') {
                        endString = '┗━━━━━━━┛'
                        $g.logTime = 0
                        s = s.substr(10)
                        b = true
                    }
                    // 执行清理
                    if (b) {
                        if (s === '') {
                            if (args.length === 1) return
                            args.shift()
                        } else {
                            args[0] = s
                        }
                    }
                }
                const a: Array<any> = new Array<any>()
                if (timeString) a.push(timeString)
                for (let i = 0; i < args.length; i++) {
                    const item: any = args[i],
                        type: string = $g.className(item)
                    s = ''
                    switch (type) {
                        // [ArrayBuffer 16M 978923972..(8个)...... : 对象]
                        case 'Int8Array':
                        case 'Int16Array':
                        case 'Int32Array':
                        case 'Uint8Array':
                        case 'Uint16Array':
                        case 'Uint32Array':
                        case 'DataView':
                        case 'ArrayBuffer':
                            let arraybuffer: ArrayBuffer
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
                                if (l - m > 4) {
                                    s += dv.getInt32(m, false).toString()
                                    m += 4
                                } else {
                                    s += 'u8(' + dv.getUint8(m).toString() + ')'
                                    m += 1
                                }
                                if (m >= 32) {
                                    s += '......'
                                    break
                                }
                            }
                            s += ' : '
                            a.push(s)
                            a.push(item)
                            a.push(']')
                            break;
                        default:
                            a.push(item)
                    }
                }
                if (a.length) console.log(...a);
                if (endString) console.log(endString);
            }
        } catch (e) {
            console.error('console.log error', e);
        }
    }
}