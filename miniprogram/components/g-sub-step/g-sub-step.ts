import { $g } from "../../frame/speed.do"
import { DataStep, DataStepItem } from "../../frame/data/data.step"

/**
 * 组件 : g-sub-step
 * 信息放到 GData 中
 * 步进器
 *     正在进行的在中间
 *     有关闭和非关闭选项, 用绝对定位在中间, 中间层级最高, 二边缩小, 每条有高度
 *     现在的步骤在中间
 *     每条有 图标, 标题和内容, 出错信息 (带关闭)
 *      {icon:string, title:string, note:string}
 */
Component({
    options: {
        styleIsolation: 'isolated',
    },
    /** 组件属性列表 properties和data指向同对象, 可定义函数 */
    properties: {
        /** 现在是否展示出步进器 */
        open: { type: Boolean, value: false },
    },
    /** 组件的内部数据 */
    data: {
        sceneHeight: 0,
        /** 上面已经完成区域 */
        topHeight: 0,
        /** 中间的区域高度 */
        centerHeight: 100,
        /** 下面未进行区域 */
        endHeight: 0,
        /** 已经完成的列表 */
        itemFinish: new Array<any>(),
        /** 正在进行中的内容 */
        itemRun: {},
        /** 还未进行的 */
        itemWait: new Array<any>(),
        /** 是否显示关闭按钮 */
        close: { type: Boolean, value: false },
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        /** 实例进入页面节点树时执行),可以setData */
        attached() {
            // $g.log('[组件][g-sub-step]')
            const scene: DataScene = $g.g.app.scene
            this.setData({ sceneHeight: scene.winHeight })
        },
    },
    /** 组件所在页面的生命周期函数 */
    pageLifetimes: {
        /** 所在的页面被展示时执行 */
        show() {
            this.setInfo()
            $g.step.method = this.setInfo.bind(this)
        },
    },
    /** 组件的方法列表 */
    methods: {
        /** 设置步进器 */
        setInfo(): Promise<any> {
            return new Promise(resolve => {
                // $g.log('[组件][g-sub-step]setInfo')
                this.data.itemFinish.length = 0
                this.data.itemWait.length = 0
                this.data.itemRun = {}
                const list: any = $g.step.list
                if (list && list.length) {
                    for (let i = 0; i < list.length; i++) {
                        const item: any = list[i]
                        if (i === $g.step.index) {
                            this.data.itemRun = item
                        } else if (i < $g.step.index) {
                            this.data.itemFinish.push(item)
                        } else {
                            this.data.itemWait.push(item)
                        }
                    }
                    // 重新设置高度
                    const scene: DataScene = $g.g.app.scene
                    let centerHeight: number = 140
                    if ($g.step.list.length - 1 < $g.step.index) {
                        $g.step.index = $g.step.list.length - 1
                    }
                    let itemRun: DataStepItem = $g.step.list[$g.step.index]
                    if (itemRun.smallList.length && itemRun.smallIndex !== -1) {
                        itemRun.smallIndex = $g.step.indexMin
                        centerHeight += itemRun.smallList.length * 60 + 40
                    }
                    let sx: number = (scene.winHeight - centerHeight) / 2
                    this.setData({
                        open: true,
                        itemFinish: this.data.itemFinish,
                        itemRun: this.data.itemRun,
                        itemWait: this.data.itemWait,
                        topHeight: sx,
                        centerHeight: centerHeight,
                        endHeight: sx,
                    }, () => {
                        // $g.log('[组件][g-sub-step]setData 完成')
                        return resolve()
                    })
                } else {
                    this.setData({
                        open: false
                    }, () => {
                        return resolve()
                    })
                }
            })
        },
        btClose(e: any) {
            this.setData({ open: false })
        },
    },
})
