import { $g } from "../../frame/speed.do"
import { DBTemplate } from "./../../lib/g-data-lib/db.template";

/**
 * 组件, 标题ICON
 * 属性 : selectName 为字符串, 是 icon 的名称
 * 监听 : change 回传为对象, 里面的 name 是 icon 的名称
 */
Component({
    options: {
        multipleSlots: true,
        styleIsolation: 'isolated',
    },
    /** 组件属性列表 properties和data指向同对象, 可定义函数 */
    properties: {
        open: { type: Boolean, value: true },// 默认是否为关闭
        selectName: { type: String, value: 'key' },// 现在选中的图标序列
    },
    /** 组件的内部数据 */
    data: {
        /** 整个弹出层的高度 */
        sceneHeight: 0,
        /** 台头的导航栏高度 */
        topBarTop: 0,
        /** 台头标题的高度 */
        topHeight: 100,
        /** 滚动区域高度 */
        listHeight: 0,
        /** 下面的留白 */
        endHeight: 30,
        /** 列表 */
        typeList: DBTemplate.list
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        attached() {
            const scene: DataScene = $g.g.app.scene
            // scene.topBarHeight + scene.topBarTop
            const fullHeight: number = scene.winHeight - scene.topBarHeight - scene.topBarTop
            const centerHeight: number = fullHeight - this.data.topHeight - this.data.endHeight
            this.setData({
                sceneHeight: scene.winHeight,
                topBarTop: scene.topBarTop + scene.topBarHeight,
                listHeight: centerHeight,
                typeList: DBTemplate.list
            })
        },

    },
    /** 组件的方法列表 */
    methods: {
        btSelect(e: any) {
            const index: number = Number(e.currentTarget.dataset.index)
            const info: any = DBTemplate.list[index]
            if (info) {
                // title: '通用', name: 'normal', type: 'entry', icon: 0, list: [
                //     { icon: '', key: '', keyname: '别名', type: 'string', def: '' }
                // ]
                $g.g.app.timeMouse = Date.now()
                if (info.type === 'entry') {
                    wx.navigateTo({
                        url: '/pages/showdb/entry/entry?type=add&infotype=' + info.name
                    })
                } else if (info.type === 'group') {
                    wx.navigateTo({
                        url: '/pages/showdb/group/group?type=add&infotype=' + info.name
                    })
                }
            }
            this.setData({ open: false })
        },
        btClose(e: any) {
            this.setData({ open: false })
        },
    },
})
