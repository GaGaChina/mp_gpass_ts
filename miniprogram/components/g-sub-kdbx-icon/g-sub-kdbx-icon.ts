import { $g } from "../../frame/speed.do"
import { KdbxIcon } from "../../lib/g-data-lib/kdbx.icon"

/**
 * 组件, 标题ICON
 */
Component({
    options: {
        multipleSlots: true,
        styleIsolation: 'isolated',
    },
    /** 组件属性列表 properties和data指向同对象, 可定义函数 */
    properties: {
        open: { type: Boolean, value: true },// 默认是否为关闭
        selectIndex: { type: Number, value: 0 },// 现在选中的图标序列
    },
    /** 组件的内部数据 */
    data: {
        sceneHeight: 0,
        topHeight: 0,
        listHeight: 0,
        endHeight: 0,
        iconList: KdbxIcon.list,
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        attached() {
            const scene: DataScene = $g.g.app.scene
            // scene.topBarHeight + scene.topBarTop
            const top: number = ~~(scene.winHeight * 0.3)
            let info: number = ~~(scene.winHeight * 0.6)
            // 上下减少30 info-60 (按钮) 110一个
            info = ~~((info - 60) / 110) * 110 + 60 + 55
            this.setData({
                sceneHeight: scene.winHeight,
                topHeight: top,
                listHeight: info,
                endHeight: scene.winHeight - top - info,
                iconList: KdbxIcon.list
            })
        },
    },
    /** 组件所在页面的生命周期函数 */
    pageLifetimes: {
    },
    /** 组件的方法列表 */
    methods: {
        btSelectIcon(e: any) {
            if (this.data.selectIndex !== e.currentTarget.dataset.index) {
                // <abc bind:change="showTab"></abc>
                // 父级 showTab(e){e.detail}
                this.triggerEvent('change', { 'index': e.currentTarget.dataset.index });
                this.setData({
                    selectIndex: e.currentTarget.dataset.index,
                    open: false
                })
            } else {
                this.setData({ open: false })
            }
        },
        btClose(e: any) {
            this.setData({ open: false })
        }
    },
})
