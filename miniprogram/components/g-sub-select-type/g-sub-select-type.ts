import { $g } from "../../frame/speed.do"
import { AwesomeIcon } from "./../../fonts/awesome"

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
        sceneHeight: 0,
        topHeight: 0,
        listHeight: 0,
        endHeight: 0,
        findName: '',
        iconList: AwesomeIcon.list,
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
                iconList: AwesomeIcon.list
            })
        },
    },
    /** 组件所在页面的生命周期函数 */
    pageLifetimes: {
    },
    /** 组件的方法列表 */
    methods: {
        btSelectIcon(e: any) {
            if (this.data.selectName !== e.currentTarget.dataset.name) {
                this.triggerEvent('change', { 'name': e.currentTarget.dataset.name });
                this.setData({
                    selectName: e.currentTarget.dataset.name,
                    open: false
                })
            } else {
                this.setData({ open: false })
            }
        },
        btClose(e: any) {
            this.setData({ open: false })
        },
        txFind(e: any) {
            const find: string = ''
            if (this.data.findName) {
                this.setData({
                    findName: find,
                    iconList: AwesomeIcon.find(find),
                })
            }
        }
    },
})
