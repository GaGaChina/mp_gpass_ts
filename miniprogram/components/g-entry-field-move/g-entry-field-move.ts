import { AES } from "../../frame/crypto/AES"
import { $g } from "../../frame/speed.do"

/**
 * 组件 : 弹出添加 Face Id 的界面
 */
Component({
    options: {
        styleIsolation: 'isolated',
    },
    /** 组件属性列表 properties和data指向同对象, 可定义函数 */
    properties: {
        open: { type: Boolean, value: true },// 默认是否为关闭
        /** 列表 */
        list: { type: Array, value: [] },
    },
    /** 组件的内部数据 */
    data: {
        sceneHeight: 0,
        topHeight: 0,
        centerHeight: 0,
        endHeight: 135,
        dragBegin: false,
        dragStartY: 0,
        selectIndex: 0,
        selectIcon: '',
        selectKey: '',
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        /** 实例进入页面节点树时执行),可以setData */
        attached() {
            const scene: DataScene = $g.g.app.scene
            this.data.topHeight = scene.topBarHeight + scene.topBarTop + 20
            this.setData({
                sceneHeight: scene.winHeight,
                topHeight: this.data.topHeight,
                centerHeight: scene.winHeight - this.data.topHeight - this.data.endHeight - scene.endBarHeight,
            })
        },
    },
    /** 组件的方法列表 */
    methods: {
        dragStart(e: any) {
            // $g.log('[dragStart]', e)
            const selectIndex: number = Number(e.currentTarget.dataset.index)
            // $g.log('[dragStart]selectIndex:', selectIndex)
            if (selectIndex > -1 && selectIndex < this.data.list.length) {
                const info: any = this.data.list[selectIndex]
                // $g.log('[dragStart]info', info)
                if (info) {
                    this.setData({
                        dragBegin: true,
                        selectIndex: selectIndex,
                        selectIcon: info.icon,
                        selectKey: info.key,
                        dragStartY: ~~(e.changedTouches[0].clientY * $g.g.app.scene.pxRpx / 1000 - this.data.topHeight - 50)
                    })
                }
            }
        },
        dragMove(e: any) {
            //$g.log('[dragMove]', e)
            if (this.data.dragBegin) {
                const y: number = ~~(e.changedTouches[0].clientY * $g.g.app.scene.pxRpx / 1000 - this.data.topHeight - 50)
                if (y !== this.data.dragStartY) {
                    this.setData({ dragStartY: y })
                }
                this.changeMove(y)
            }
        },

        dragEnd(e: any) {
            // $g.log('[dragEnd]', e)
            if (this.data.dragBegin) {
                const y: number = ~~(e.changedTouches[0].clientY * $g.g.app.scene.pxRpx / 1000 - this.data.topHeight - 50)
                this.setData({
                    dragStartY: y,
                    dragBegin: false
                })
                this.changeMove(y)
            }
        },
        /** 现在移动的位置 */
        changeMove(y: number) {
            y = y + 50
            if (y < 0) y = 0
            let changeIndex: number = ~~(y / 100)
            if (changeIndex > this.data.list.length - 1) {
                changeIndex = this.data.list.length - 1
            }
            if (this.data.selectIndex !== changeIndex) {
                // 交换位置
                const select: any = this.data.list[this.data.selectIndex]
                const change: any = this.data.list[changeIndex]
                this.data.list[this.data.selectIndex] = change
                this.data.list[changeIndex] = select
                this.setData({
                    selectIndex: changeIndex,
                    list: this.data.list
                })
            }
        },
        btClose(e: any) {
            this.triggerEvent('change', this.data.list);
            this.setData({ open: false })
        }
    },
})
