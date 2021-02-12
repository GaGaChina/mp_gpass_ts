import { $g } from "../../frame/speed.do"
import { KdbxIcon } from "../../lib/g-data-lib/kdbx.icon";

Component({
    options: {
        styleIsolation: 'isolated',
    },
    /** 组件属性列表 properties和data指向同对象, 可定义函数 */
    properties: {
        /** 默认的icon图标 */
        list: { type: Array, value: [] },
        /** 是否支持拖动, 修改位置, 拖动的时候切换为普通模式 */
        drag: { type: Boolean, value: true },
        /** add:添加条目, edit:编辑条目, show:展示条目 */
        type: { type: String, value: 'show' }
    },
    /** 组件的内部数据 */
    data: {
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        /** 实例进入页面节点树时执行),可以setData */
        attached() {
            // $g.log('[组件][Entry-Field-Group]创建', this.data);
        }
    },
    /** 组件的方法列表 */
    methods: {
        fieldchange(e: any) {
            // $g.log('[组件][Entry-Group]', e)
            const info: any = e.detail
            this.data.list[info.index] = info
            // this.setData({ list: this.data.list })
            // 不能进行触发 , 否则就死循环了
            this.triggerEvent('change', this.data.list);
        }
    },
})
