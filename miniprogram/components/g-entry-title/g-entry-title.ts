import { $g } from "../../frame/speed.do"
import { KdbxIcon } from "../../lib/g-data-lib/kdbx.icon";

Component({
    options: {
        styleIsolation: 'isolated',
    },
    /** 组件属性列表 properties和data指向同对象, 可定义函数 */
    properties: {
        /** 默认的icon图标 */
        icon: { type: Number, value: 0 },
        title: { type: String, value: '' },
        /** add:添加条目, edit:编辑条目, show:展示条目 */
        type: { type: String, value: 'show' }
    },
    /** 组件的内部数据 */
    data: {
        /** 是否显示选择ICON的窗口 */
        openWinIcon: false,
        /** 图标的名称 */
        iconstr: ''
    },
    /** 数据字段监听器，监听 setData 的 properties 和 data 变化 */
    observers: {
        'icon': function (icon) {
            this.setData({ iconstr: KdbxIcon.list[icon] })
        },
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        /** 实例进入页面节点树时执行),可以setData */
        attached() {
            this.setData({ iconstr: KdbxIcon.list[this.data.icon] })
            // $g.log('[组件][Entry-Title]创建', this.data);
        }
    },

    /** 组件的方法列表 */
    methods: {
        /** 显示IOCN图标的窗口 */
        btSelectIcon(e: any) {
            this.setData({ openWinIcon: true })
        },
        changeIcon(e: any) {
            let index: number = Number(e.detail.index)
            if (this.data.icon !== index) {
                this.setData({
                    icon: index,
                    iconstr: KdbxIcon.list[index]
                })
                this.triggerEvent('change', { icon: this.data.icon, title: this.data.title });
            }
        },
        inputValChange(e: any) {
            if (this.data.title !== e.detail.value) {
                this.data.title = e.detail.value
                this.triggerEvent('change', { icon: this.data.icon, title: this.data.title });
            }
        }
    },
})
