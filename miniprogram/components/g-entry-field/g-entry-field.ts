import { $g } from "../../frame/speed.do"
import { WXClipboard } from "../../frame/wx/wx.clipboard";
import { DBItem, DBLib } from "../../lib/g-data-lib/db";
import { ProtectedValue } from "../../lib/kdbxweb/types";

/**
 * 组件, 单条的编辑对象
 * info : 传递的对象, 不要对双向绑定, 需要进行监听
 * change : 会把对象回传回去
 */
Component({
    options: {
        styleIsolation: 'isolated',
    },
    /** 组件属性列表 properties和data指向同对象, 可定义函数 */
    properties: {
        /** 是否显示下边条 */
        showborder: { type: Boolean, value: true },
        /** add:添加条目, edit:编辑条目, show:展示条目 */
        type: { type: String, value: 'show' },
        /** 直接将对象进行引用 */
        info: {
            type: Object,
            optionalTypes: [String],
            value: {
                icon: '', // 默认的icon图标
                key: '', // 键的名称
                keyname: '', // 键的显示名称
                value: '', // 值
                valuetype: '',// 值的类型, string 文本, txt 文本区域, pv 密码
                changekey: true,// 是否允许修改 key 的值
                changetype: true,// 是否允许修改类型
                changeicon: true,// 是否允许修改 Icon 的值
                candel: true,// 是否允许删除
                warning: false,// 是否显示出警告
            },
        },
    },
    /** 组件的内部数据 */
    data: {
        /** 是否显示选择ICON的窗口 */
        openWinIcon: false,
        /** 现在是否显示出密码 */
        showpass: false,
    },
    /** 数据字段监听器，监听 setData 的 properties 和 data 变化 */
    observers: {
        // 设置 this.data.some 或 this.data.some.field 本身或其下任何子数据字段时触发[可以触发]
        'info.**': function (o) {
            $g.log('[组件][Entry-Field]触发', o)
            // <abc bind:showTab="showTab"></abc>
            // 父级 showTab(e){e.detail}
            // if (this.data.oldinfo !== JSON.stringify(o)) {
            //     this.setData({ oldinfo: JSON.stringify(o) })
            //     // this.triggerEvent('change', o);
            // }
            this.triggerEvent('change', o);
        },
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        /** 实例进入页面节点树时执行),可以setData */
        attached() {
            $g.log('[组件][Entry-Field]创建', this.data);
            if (this.data.info.icon === '') {
                this.data.info.icon = this.data.info.valuetype === 'pv' ? 'lock' : 'unlock'
                this.setData({ info: this.data.info })
            }
            this.setData({ openWinIcon: false })
        }
    },
    /** 组件的方法列表 */
    methods: {
        /** 拷贝值到剪切板 */
        btCopy(e: any) {
            // if (this.data.info.valuetype === 'pv') {
            //     WXClipboard.setDate(this.getPVText())
            // } else if (this.data.info.value.length > 0) {
            //     WXClipboard.setDate(this.data.info.value)
            // }
            WXClipboard.setDate(this.data.info.value)
        },
        /** 获取 pv 内的值 */
        // getPVText(): string {
        //     if (this.data.info.valuetype === 'pv') {
        //         const dbItem: DBItem | null = $g.g.dbLib.selectItem
        //         if (dbItem && dbItem.selectEntry) {
        //             if ($g.hasKey(dbItem.selectEntry.fields, this.data.info.key)) {
        //                 const pv: any = dbItem.selectEntry.fields[this.data.info.key]
        //                 if ($g.isClass(pv, 'ProtectedValue')) {
        //                     return pv.getText()
        //                 }
        //             }
        //         }
        //     }
        //     $g.log('[组件][Entry-Field]getPVText 失败')
        //     return ''
        // },
        btShowPass(e: any) {
            if (this.data.info.valuetype === 'pv') {
                this.setData({ showpass: !this.data.showpass })
            }
        },
        /** 显示IOCN图标的窗口 */
        btSelectIcon(e: any) {
            this.setData({ openWinIcon: true })
        },
        changeIcon(e: any) {
            // $g.log('[组件][Entry-Field]changeIcon', e)
            this.data.info.icon = String(e.detail.name)
            this.setData({ info: this.data.info })
        },
        inputKeyChange(e: any) {
            if (this.data.info.key !== e.detail.value) {
                this.data.info.key = e.detail.value
                this.data.info.keyname = e.detail.value
                this.setData({ info: this.data.info })
            }
        },
        inputValChange(e: any) {
            if (this.data.info.value !== e.detail.value) {
                this.data.info.value = e.detail.value
                this.setData({ info: this.data.info })
            }
        }
    },
})
