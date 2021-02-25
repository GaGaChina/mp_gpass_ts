import { $g } from "../../frame/speed.do"
import { WXClipboard } from "../../frame/wx/wx.clipboard";
import { DBItem, DBLib } from "../../lib/g-data-lib/db";
import { ProtectedValue } from "../../lib/kdbxweb/types";

/**
 * 组件, 单条的编辑对象
 * info : 传递的对象, 不要对双向绑定, 需要进行监听
 * change : 会把对象回传回去
 * A -> 数据 -> 操作到B -> 要重构
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
        /** 文件的原始内容 */
        source: { type: Object, value: {} },
        warningkey: { type: Boolean, value: false },
    },
    /** 组件的内部数据 */
    data: {
        /** 是否显示选择ICON的窗口 */
        openWinIcon: false,
        /** 弹出修改密码窗口 */
        openWinPass: false,
        /** 现在是否显示出密码 */
        showpass: false,
        /** 直接将对象进行引用 */
        info: {
            index: 0, // 在数组中的位置
            icon: '', // 默认的icon图标
            key: '', // 键的名称
            keyname: '', // 键的显示名称
            keydiff: false,// key和name 是不是不同, 如果是true, key将不能修改
            value: '', // 值
            valuetype: '',// 值的类型, string 文本, txt 文本区域, pv 密码
            changekey: true,// 是否允许修改 key 的值
            changetype: true,// 是否允许修改类型
            changeicon: true,// 是否允许修改 Icon 的值
            candel: true,// 是否允许删除
            canmove: true,// 是否可以移动位置
        },
    },
    /** 数据字段监听器，监听 setData 的 properties 和 data 变化 */
    observers: {
        'source': function () {
            if (this.handleSource(true)) {
                this.setData({ info: this.data.info })
            }
        },
        // 设置 this.data.some 或 this.data.some.field 本身或其下任何子数据字段时触发[可以触发]
        'info.valuetype': function (o) {
            if (o === 'pv') {
                this.setData({ showpass: false })
            } else {
                this.setData({ showpass: true })
            }
        },
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        /** 实例进入页面节点树时执行),可以setData */
        attached() {
            // $g.log('[组件][Entry-Field]创建', this.data);
            let changeInfo: boolean = this.handleSource(true)
            if (this.data.info.icon === '') {
                this.data.info.icon = this.data.info.valuetype === 'pv' ? 'lock' : 'unlock'
                changeInfo = true
            }
            if (!this.data.info.keydiff) {
                if (this.data.info.key !== '' && this.data.info.keyname === '') {
                    this.data.info.keyname = this.data.info.key
                    changeInfo = true
                }
            }
            if (changeInfo) {
                this.setData({
                    info: this.data.info,
                    openWinIcon: false
                })
            } else {
                this.setData({ openWinIcon: false })
            }
        }
    },
    /** 组件的方法列表 */
    methods: {
        /**
         * 拷贝值
         * @param isGet 是否是获取 Source 到本地
         */
        handleSource(isGet: boolean): boolean {
            const list: Array<string> = Object.keys(this.data.info)
            let isChange: boolean = false
            const datainfo: any = this.data.info
            for (let i = 0; i < list.length; i++) {
                const key = list[i]
                if ($g.hasKey(this.data.source, key)) {
                    if (datainfo[key] !== this.data.source[key]) {
                        if (isGet) {
                            datainfo[key] = this.data.source[key]
                        } else {
                            this.data.source[key] = datainfo[key]
                        }
                        isChange = true
                    }
                }
            }
            return isChange
        },
        /** 拷贝值到剪切板 */
        btCopy(e: any) {
            WXClipboard.setDate(this.data.info.value)
        },
        btShowPass(e: any) {
            $g.g.app.timeMouse = Date.now()
            if (this.data.info.valuetype === 'pv') {
                this.setData({ showpass: !this.data.showpass })
            }
        },
        /** 显示IOCN图标的窗口 */
        btSelectIcon(e: any) {
            $g.g.app.timeMouse = Date.now()
            this.setData({ openWinIcon: true })
        },
        btOpenPass() {
            $g.g.app.timeMouse = Date.now()
            this.setData({ openWinPass: true })
        },
        btMove() {
            $g.log('开始移动')
            this.triggerEvent('move', this.data.source)
        },
        btDel() {
            $g.log('删除')
            this.triggerEvent('del', this.data.source)
        },
        changeIcon(e: any) {
            $g.g.app.timeMouse = Date.now()
            // $g.log('[组件][Entry-Field]changeIcon', e)
            this.data.info.icon = String(e.detail.name)
            this.data.source.icon = this.data.info.icon
            this.setData({ info: this.data.info })
            this.triggerEvent('change', this.data.source)
        },
        /** 组件 Creat-Pass 传递密码 */
        setPass(e: any) {
            $g.log('设置密码结果 : ', e)
            $g.g.app.timeMouse = Date.now()
            if (this.data.info.value !== String(e.detail.pass)) {
                this.data.info.value = String(e.detail.pass)
                this.data.source.value = this.data.info.value
                this.setData({ info: this.data.info })
                this.triggerEvent('change', this.data.source)
            }
        },
        inputKeyChange(e: any) {
            // $g.log('键值修改 : ', this.data.info.keyname, ' : ', e.detail.value)
            let key: string = e.detail.value.trim()
            if (this.data.info.keyname !== key) {
                $g.g.app.timeMouse = Date.now()
                if (!this.data.info.keydiff) {
                    this.data.info.key = key
                    this.data.source.key = key
                }
                this.data.info.keyname = key
                this.data.source.keyname = key
                // this.setData({ info: this.data.info })
                this.triggerEvent('change', this.data.source)
                // this.triggerEvent('change', JSON.parse(JSON.stringify(this.data.info)))
            }
        },
        inputValChange(e: any) {
            if (this.data.info.value !== e.detail.value) {
                $g.g.app.timeMouse = Date.now()
                this.data.info.value = e.detail.value
                this.data.source.value = e.detail.value
                this.triggerEvent('change', this.data.source)
                this.setData({ info: this.data.info })
            }
        }
    },
})
