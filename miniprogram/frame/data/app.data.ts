import { $g } from "../speed.do";

/**
 * 将app.globalData数据和本地数据进行关联
 * 
 * 将 app.globalData.key -> storage.GD_key 中, 性能提高
 * 
 * 有目的性的从本地存储数据到globalData中
 * & : 扩展模式, * 全部, ! 不拷贝部分
 *     跟着属性名是要进行拷贝的
 * 
 * g→s
 * s→g
 * 
 * s→g, app.&*,!appVer
 * 
 * 然后将本地数据和globalData关联
 * 同一个微信用户，同一个小程序 storage 上限为 10MB
 */
export class AppData {

    /** 全局数据 globalData 引用 */
    public g!: IAppOption["globalData"];

    constructor(app: IAppOption) {
        this.g = app.globalData;
    }

    /** 获取本地数据 */
    public storageGet(key: string): any {
        let o: any = null
        try {
            o = wx.getStorageSync(key)
        } catch (e) {
            $g.log("[Storage]get 异常")
            this.storageInfo()
        }
        return o
    }

    /** 保存本地数据 */
    public storageSet(key: string, o: any): any {
        try {
            wx.setStorageSync(key, o);
        } catch (e) {
            $g.log("[Storage]set 异常");
            this.storageInfo();
        }
        return o;
    }

    /**
     * 存储本地数据, key可以使用globalData中的变量
     * @param key 存储的关键字
     * @param app app的引用
     */
    public storageClear(key: string = ''): void {
        if (!key) {
            const info: WechatMiniprogram.GetStorageInfoSyncOption = wx.getStorageInfoSync();
            for (const v of info.keys) {
                wx.removeStorageSync(v);
            }
            $g.log("[Storage]ClearAll");
        } else {
            $g.log("[Storage]Clear key : " + key);
            wx.removeStorageSync(key);
        }
    }

    /** 获取数据的尺寸 */
    public storageInfo(): void {
        const info: WechatMiniprogram.GetStorageInfoSyncOption = wx.getStorageInfoSync();
        $g.log(`[Storage]Info ${info.currentSize}kb / ${info.limitSize}kb keys : `, info.keys);
    }

    /** 获取全部的 Storage 数据 */
    public storageAll(): any {
        const o: any = {}
        const info: WechatMiniprogram.GetStorageInfoSyncOption = wx.getStorageInfoSync();
        for (const v of info.keys) {
            o[v] = wx.getStorageSync(v)
        }
        return o
    }

    /**
     * globalData -> Storage
     * @param keys user.jyj类似这样的路径
     * @param mode 模式*整个对象复制, ,号分割, ! 不拷贝的key
     */
    public copyGS(keys: string, mode: string = '*'): void {
        if (!keys) return;
        $g.log('[Storage] G→S key : ' + keys + ' mode : ' + mode);
        // 取出第一位
        const key_array: Array<string> = keys.split('.')
        const key: string = key_array[0]
        let g: any = this.g
        g = g[key]
        let s: any = this.getS(key)
        key_array.shift()
        s = $g.copyAB(g, s, key_array.join('.'), mode);
        this.storageSet('GD_' + key, s);
    }

    /**
     * Storage → globalData
     * @param keys user.jyj类似这样的路径
     * @param mode 模式*整个对象复制, ,号分割, ! 不拷贝的key
     */
    public copySG(keys: string, mode: string = '*'): void {
        if (!keys) return;
        $g.log('[Storage] S→G key : ' + keys + ' mode : ' + mode);
        // 取出第一位
        const key_array: Array<string> = keys.split('.')
        const key: string = key_array[0]
        let g: any = this.g
        g = g[key]
        let s: any = this.getS(key)
        key_array.shift()
        s = $g.copyAB(s, g, key_array.join('.'), mode);
    }

    /**
     * 获取 本地存储 下的keys路径对象或值, 对应 globalData 数据以 GD_ 开头
     * @param keys user.jyj类似这样的路径, '':返回'GD_'开头的全部数据
     */
    public getS(keys: string = ''): any {
        let o: any = null
        let key: string = ''
        if (keys === '') {
            // keys 为空 返回 GD_ 内全部内容
            o = {}
            const info: WechatMiniprogram.GetStorageInfoSyncOption = wx.getStorageInfoSync();
            for (const v of info.keys) {
                if (v.substr(0, 3) === 'GD_') {
                    key = v.substr(3)
                    o[key] = this.storageGet('GD_' + key)
                }
            }
            return o
        } else if (keys.indexOf('.') !== -1) {
            // 不带 . 如有 GD_ key 返回, 无返回 keys 的内容
            const info: WechatMiniprogram.GetStorageInfoSyncOption = wx.getStorageInfoSync();
            if (info.keys.indexOf('GD_' + keys) !== -1) {
                key = 'GD_' + keys
            } else {
                key = keys
            }
            return this.storageGet(key)
        } else {
            // 首先得到 第一位 GD_ key 内容 或 key 内容, 然后抽取里面的内容
            const key_array: Array<string> = keys.split('.')
            key = key_array[0]
            const info: WechatMiniprogram.GetStorageInfoSyncOption = wx.getStorageInfoSync();
            if (info.keys.indexOf('GD_' + key) !== -1) {
                key = 'GD_' + key
            }
            o = this.storageGet(key)
            key_array.shift()
            return $g.getKeys(o, key_array.join('.'))
        }
    }

    /**
     * 获取全局app.globalData下的keys路径对象或值
     * @param keys user.jyj类似这样的路径
     */
    public getG(keys: string = ''): any {
        // $g.log('[Storage]get G key : ' + keys);
        if (!keys) return this.g;
        return $g.getKeys(this.g, keys);
    }

}