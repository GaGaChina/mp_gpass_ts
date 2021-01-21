import { $g } from "../../frame/speed.do"

Component({
    options: {},
    /** 组件的属性列表 properties和data指向的是同一个js对象 */
    properties: {},
    // 组件的初始数据
    data: {
        darkmode: $g.globalData.app.darkmode
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        /** 实例进入页面节点树时执行),可以setData */
        attached() {
            $g.log('[组件][g-page-bg]创建');
            wx.onThemeChange(this.themeChange.bind(this));
        },
        /** 视图层布局完成后执行 */
        ready() { },
        /** 实例被移动到节点树另一个位置时执行 */
        moved() { },
        /** 实例被从页面节点树移除时执行 */
        detached() {
            wx.offThemeChange(this.themeChange);
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
            if (e.theme === 'light') {
                this.setData({darkmode: false})
            }else{
                this.setData({darkmode: true})
            }
        }

    },
})
