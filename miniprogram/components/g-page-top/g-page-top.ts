import { $g } from "../../frame/speed.do"
import { WXUser } from "../../frame/wx/wx.user"

Component({
    options: {},
    /** 组件的属性列表 properties和data指向的是同一个js对象 */
    properties: {
        show: { type: Boolean, value: true },// 是否显示
        title: { type: String, value: "密码档案" },// 显示的标题
        canBack: { type: Boolean, value: true },// 是否显示后退
    },
    // 组件的初始数据
    data: {
        darkmode: $g.globalData.app.darkmode,
        topHeight: 0,
        hasWXUser: false,// 是否有微信登录信息
        userHead: '',
        nickName: '',
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        /** 实例进入页面节点树时执行),可以setData */
        attached() {
            $g.log('[组件][g-page-top]创建');
            this.setData({
                topHeight: $g.globalData.app.scene.topBarHeight + $g.globalData.app.scene.topBarTop,
                hasWXUser: WXUser.appHaveInfo(),
                userHead: $g.globalData.userWX?.avatarUrl ?? '',
                nickName: $g.globalData.userWX?.nickName ?? ''
            })
            if ($g.globalData.app.darkusable) wx.onThemeChange(this.themeChange.bind(this));
        },
        /** 视图层布局完成后执行 */
        ready() { },
        /** 实例被移动到节点树另一个位置时执行 */
        moved() { },
        /** 实例被从页面节点树移除时执行 */
        detached() {
            if ($g.globalData.app.darkusable) wx.offThemeChange(this.themeChange);
        },
        /** 组件方法抛出错误时执行 */
        error() { },
    },
    /** 组件所在页面的生命周期函数 */
    pageLifetimes: {},
    /** 组件的方法列表 */
    methods: {
        themeChange(e) {
            $g.log(e)
            if ($g.globalData.app.darkusable) {
                if (e.theme === 'light') {
                    this.setData({ darkmode: false })
                } else {
                    this.setData({ darkmode: true })
                }
            }
        },
        btGetUserInfo(e: any) {
            console.log('点击微信授权 : ', e);
            WXUser.setUserInfo(e.detail);
            this.callSetData();
        },
        callSetData() {
            if (WXUser.appHaveInfo()) {
                this.setData({
                    hasWXUser: true,
                    userHead: $g.globalData.userWX?.avatarUrl,
                    nickName: $g.globalData.userWX?.nickName
                })
            }
        },
        /** 后退页面 */
        btBack(e: any) {
            const cps:any = getCurrentPages()
            $g.log('组件点击返回', cps);
            let route: string = '';
            if (cps && cps.length) {
                route = cps[cps.length - 1].route;
            }
            switch (route) {
                case 'pages/question/pages/machine/machine':
                case 'pages/question/pages/testing/testing':
                    wx.showModal({
                        title: '请确认', content: '你确定要退出考试吗?', confirmText: '确定退出', cancelText: '继续作答',
                        success(res) { if (res.confirm) wx.reLaunch({ url: '/pages/index/index' }); }
                    });
                    break;
                default:
                    wx.navigateBack();
            }
        }
    },
})
