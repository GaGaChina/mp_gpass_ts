import { $g } from "../../frame/speed.do"

/**
 * [进行了一半]
 * 组件 : g-sub-step
 * 步进器
 *     有关闭和非关闭选项, 用绝对定位在中间, 中间层级最高, 二边缩小, 每条有高度
 *     现在的步骤在中间
 *     每条有 图标, 标题和内容, 出错信息 (带关闭)
 */
Component({
    options: {
        /** 默认一个组件只有一个 slot, true启用多slot支持 */
        multipleSlots: true,
        /**
         * 2.6.5 开始支持
         * isolated         : 组件内外样式隔离
         * apply-shared     : 页面影响组件,组件不影响页面
         * shared           : [默认]组件页面互相影响
         * page-isolated    : 页面禁用 app.wxss, 页面 wxss 不影响其他自定义组件
         * page-apply-shared: 页面禁用 app.wxss, 页面 wxss 不影响其他自定义组件，但 shared 组件影响页面
         * page-shared      : 页面禁用 app.wxss, 页面 wxss 影响其他设为 apply-shared 或 shared 组件，也会受到 shared 组件影响
         */
        styleIsolation: 'isolated',
    },
    /** 组件属性列表 properties和data指向同对象, 可定义函数 */
    properties: {
        /** 现在是否展示出步进器 */
        open: { type: Boolean, value: false },
        /** 步进器列表的信息, {icon:string, title:string, note:string} */
        list: { type: Array, value: [] },
        /** 是否显示关闭按钮 */
        close: { type: Boolean, value: false },
        /** 现在执行的列表索引 */
        index: { type: Number, value: 0 },
        /** 步骤是否出错, 显示错误信息 */
        err: { type: String, value: '' }
    },
    /** 组件的内部数据 */
    data: {
        sceneHeight: 0,
        /** 列表展示的数据 */
        showlist: []
    },
    /** 数据字段监听器，监听 setData 的 properties 和 data 变化 */
    observers: {
        'disData': function (arr12) {
            // <abc bind:showTab="showTab"></abc>
            // 父级 showTab(e){e.detail}
            this.triggerEvent('showTab', arr12);
        },
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        /** 实例进入页面节点树时执行),可以setData */
        attached() {

            const scene: DataScene = $g.g.app.scene
            // scene.topBarHeight + scene.topBarTop
            const top: number = ~~(scene.winHeight * 0.3)
            let info: number = ~~(scene.winHeight * 0.6)
            // 上下减少30 info-60 (按钮) 110一个
            info = ~~((info - 60) / 110) * 110 + 60 + 55
            this.setData({
                sceneHeight: scene.winHeight,
            })

        },
    },
    /** 组件的方法列表 */
    methods: {
        btClose(e: any) {
            this.setData({ open: false })
        },
        setInfo() {
            const list: Array<Object> = this.data.list
            const showList: any = []



            for (let i = 0; i < list.length; i++) {
                const item: any = list[i]


                // 设置图标
                let icon: string = ''
                if (item?.icon) {
                    icon = item?.icon
                } else {
                    if (this.data.index === i) {
                        icon = 'play-circle-o'
                    } else if (this.data.index > i) {
                        icon = 'check-circle-o'
                    } else {
                        icon = 'stop-circle-o'
                    }
                }
                let icon_class: string = ''
                if (this.data.index === i) {
                    icon_class = 'icon_play'
                } else if (this.data.index > i) {
                    icon_class = 'icon_ok'
                } else {
                    icon_class = 'icon_stop'
                }
                const showItem: Object = {
                    id: i,
                    icon: icon,
                    icon_class: icon_class,
                    title: item?.title ?? '',
                    note: item?.note ?? '',
                    top: i * 50,
                }
                showList.push(showItem)
            }

            this.setData({
                showlist: showList
            })
        }
    },
})
