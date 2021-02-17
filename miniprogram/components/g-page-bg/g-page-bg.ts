import { $g } from "../../frame/speed.do"
import { DBItem } from "../../lib/g-data-lib/db";

Component({
    options: {},
    /** 组件的属性列表 properties和data指向的是同一个js对象 */
    properties: {},
    // 组件的初始数据
    data: {
        darkmode: $g.g.app.darkmode
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        /** 实例进入页面节点树时执行),可以setData */
        // attached() {
        //     $g.log('[组件][g-page-bg]创建');
        //     wx.onThemeChange(this.themeChange.bind(this));
        // },
        /** 实例被从页面节点树移除时执行 */
        // detached() {
        //     wx.offThemeChange(this.themeChange);
        // },
    },
    /** 组件所在页面的生命周期函数 */
    pageLifetimes: {
        hide() {
            // $g.log('[组件][g-page-bg]隐藏', new Date().toLocaleString())
            if ($g.g.dbLib) {
                const dbItem: DBItem | null = $g.g.dbLib.selectItem
                if (dbItem && dbItem.db) {
                    $g.g.app.timeMouse = Date.now()
                }
            }
        }
    },
    /** 组件的方法列表 */
    methods: {
        // themeChange(e) {
        //     $g.log(e)
        //     if (e.theme === 'light') {
        //         this.setData({ darkmode: false })
        //     } else {
        //         this.setData({ darkmode: true })
        //     }
        // },
        // 不行, 会失败
        //  bindtap="btMouse" bindtouchstart="btMouse"
        // btMouse(e){
        //     $g.log('背景组件', e)
        //     $g.g.app.timeMouse = Date.now()
        // }
    },
})
