import { $g } from "../speed.do";

/** 用户答题的做答情况 */
export class WXShareData {
    /** 分享类型的key值, 可以提前注册 */
    public key: string = '';
    /** 分享朋友圈的标题 */
    public title: string = '';
    /** 分享朋友圈的信息 */
    public desc: string = '';
    /** 默认是当前页面，必须是以/开头的完整路径 */
    public path: string = '';
    /** 可以是本地文件路径、代码包文件路径或者网络图片路径，支持PNG及JPG，不传入 imageUrl 则使用默认截图。显示图片长宽比是 5:4 */
    public imageUrl: string = '';
    /** [这值好像没用]分享成功的时候回调函数 */
    public success: ((res: any) => void) | undefined = undefined;
    /** 当用户取消或分享失败的时候回调 */
    public fail: ((res: any) => void) | undefined = undefined;
    /** 不管是否成功都会回调 */
    public complete: Function | undefined = undefined;
}

/** 用户分享朋友圈的信息 */
export class WXShareFriendsData {
    /** 添加一个key值, 来维护 */
    public key: string = '';
    /** 标题，即朋友圈列表页上显示的标题 */
    public title: string = '';
    /** 自定义页面路径中携带的参数，如 path?a=1&b=2 的 “?” 后面部分 */
    public query: string = '';
    /** 自定义图片路径，可用本地文件或者网络图片。支持 PNG 及 JPG，长宽比是 1:1 */
    public imageUrl: string = '';
}

/** 分享返回接口 */
export interface ShareCallback {
    title: string;
    desc: string;
    path: string;
    imageUrl: string;
    success: (res: any) => void;
    fail: (res: any) => void;
    complete: () => void;
}

/** 分享朋友圈返回接口 */
export interface ShareFriendsCallback {
    title: string;
    query: string;
    imageUrl: string;
}

/**
 * 微信分享的统一管理
 * 
 * 不能分享到朋友圈, 只能保存图片在自己转发
 * 在 
 * data 结构 id, title, path, images
 * 
share_data: new WXShareData(),//分享的数据
<button data-sharedata="{{ 信息对象 }}" open-type="share">分享</button>
onShareAppMessage(e) {
    console.log('分享');
    console.log(e);
    const share: ShareCallback | null = WXShare.runButtonData(e);
    if (share) return share;
}
 */
export class WXShare {

    // Object.create(null)
    private static keyLib: any = {};
    /** 没有key的值存放的列表, 按先后顺序执行 */
    private static list: WXShareData[] = new Array<WXShareData>();
    /** 分享朋友圈的队列, 当页面出现可以推入队列, 结束也删除最后个, 发表只发表最后一个 */
    private static friendsList: WXShareFriendsData[] = new Array<WXShareFriendsData>();

    /** 清空全部对页面的监听 */
    public static clear(): void {
        this.keyLib = {};
        this.list.length = 0;
    }

    /** 以WXShareData数据结构来运行分享 */
    public static addObj(o: WXShareData): void {
        if (o.key) {
            this.keyLib[o.key] = o;
        } else {
            this.list.push(o);
        }
    }

    /**
     * 通过按钮上的数据来执行
     */
    public static runButtonData(e: any): ShareCallback | null {
        if ($g.hasKeys(e, 'target.dataset.sharedata')) {
            if ($g.isObject(e.target.dataset.sharedata)) {
                let o: WXShareData = e.target.dataset.sharedata;
                return this.runObj(o);
            } else if ($g.isString(e.target.dataset.sharedata)) {
                let key: string = e.target.dataset.sharedata;
                return this.runKey(key)
            } else {
                $g.log("[wx.share]data-sharedata : ", e.target.dataset.sharedata);
            }
        } else {
            $g.log("[wx.share]未在button标签中找到 data-sharedata=数据");
        }
        return null;
    }

    /** 按照key的方式来执行分享 */
    public static runKey(key: string = ''): ShareCallback | null {
        if ($g.hasKey(this.keyLib, key)) {
            const o: WXShareData = this.keyLib[key];
            return this.runObj(o);
        }
        return null;
    }

    /** 以WXShareData数据结构来运行分享 */
    public static runObj(o: WXShareData): ShareCallback {
        return this.showUseString(o.title, o.desc, o.path, o.imageUrl, o.success, o.fail, o.complete);
    }

    /**
     * 展示信息
     * @param title 
     * @param desc 
     * @param path 
     * @param imageUrl 
     * @param success 
     * @param fail 
     * @param complete 
     */
    public static showUseString(title: string, desc: string, path: string, imageUrl: string, success: ((res: any) => void) | undefined = undefined, fail: ((res: any) => void) | undefined = undefined, complete: Function | undefined = undefined): ShareCallback {
        // 设置菜单中的转发按钮触发转发事件时的转发内容
        var o = {
            title: title,        // 默认是小程序的名称(可以写slogan等)
            desc: desc,
            path: path,
            imageUrl: imageUrl,
            success: (res: any) => {
                $g.log('[wx.share]分享成功 : ', res);
                if (res.errMsg == 'shareAppMessage:ok') { }
                if (success) success(res);
            },
            fail: (res: any) => {
                $g.log('[wx.share]分享失败 : ', res);
                // 转发失败之后的回调
                switch (res.errMsg) {
                    case 'shareAppMessage:fail cancel':
                        // 用户取消转发
                        break;
                    case 'shareAppMessage:fail':
                        // 转发失败，其中 detail message 为详细失败信息
                        break;
                }
                if (fail) fail(res);
            },
            complete: () => {
                // 转发结束之后的回调（转发成不成功都会执行）
                $g.log("[wx.share]转发结束之后的回调（转发成不成功都会执行）");
                if (complete) complete();
            }
        };
        // 返回shareObj
        return o;
    }

    /**
     * 开启朋友圈分享, 暂时只有安卓
     * 将代码放到页面的OnLoad或OnRead里
     * 代码里还需要添加 onShareTimeline 的钩子
     * shareAppMessage必须得有
     * https://developers.weixin.qq.com/minigame/dev/api/share/wx.showShareMenu.html
     */
    public static startTimeline(): void {
        let option: any = {
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline'],
            success: (res: any) => {
                $g.log('[wx.share]设置分享菜单 success', res);
            },
            fail: (e: any) => {
                $g.log('[wx.share]设置分享菜单 fail', e);
            },
            complete: () => {
                $g.log('[wx.share]设置分享菜单 complete');
            }
        };
        wx.showShareMenu(option);
    }

    /** 添加到末尾 */
    public static friendsPush(o: WXShareFriendsData): void {
        this.friendsList.push(o);
    }
    /** 删除末尾 */
    public static friendsPop(): void {
        if (this.friendsList.length) this.friendsList.pop();
    }

    /** 根据key值添加, 如果有一样, 替换, 并且添加到最末尾 */
    public static friendsKeyAdd(o: WXShareFriendsData): void {
        this.friendsKeyDel(o.key);
        this.friendsList.push(o);
    }

    /** 根据key值进行删除 */
    public static friendsKeyDel(key: string): void {
        if (key) {
            const index: number = this.friendsList.findIndex(item => item.key === key);
            if (index !== -1) this.friendsList.splice(index, 1);
        }
    }

    /** 根据key值获取这个对象, 一般用于修改参数用 */
    public static friendsKeyGet(key: string): WXShareFriendsData | undefined {
        return this.friendsList.find(item => item.key === key);
    }

    public static friendsRun(): ShareFriendsCallback | null {
        if (this.friendsList.length) {
            const item: WXShareFriendsData = this.friendsList[this.friendsList.length - 1];
            return this.friendsRunObj(item);
        }
        return null;
    }

    /**
     * 分享的内容
     * @param key 关键字
     */
    public static friendsRunKey(key: string): ShareFriendsCallback | null {
        if (key) {
            const item: WXShareFriendsData | undefined = this.friendsList.find(item => item.key === key);
            if (item) this.friendsRunObj(item);
        }
        return null;
    }

    /** 直接执行分享方法 */
    public static friendsRunObj(o: WXShareFriendsData): ShareFriendsCallback {
        return {
            title: o.title,
            query: o.query,
            imageUrl: o.imageUrl
        }
    }

    /**
     * 监听右上角菜单“分享到朋友圈”按钮的行为，并自定义分享内容
     * 在page的onShareTimeline() {}里调用本函数
     * @param title 标题，即朋友圈列表页上显示的标题
     * @param query 自定义页面路径中携带的参数，如 path?a=1&b=2 的 “?” 后面部分
     * @param imageUrl 自定义图片路径，可用本地文件或者网络图片。支持 PNG 及 JPG，长宽比是 1:1
     */
    public static showFriends(title: string = '', query: string = '', imageUrl: string = ''): ShareFriendsCallback {
        return {
            title: title,
            query: query,
            imageUrl: imageUrl,
        }
    }
}