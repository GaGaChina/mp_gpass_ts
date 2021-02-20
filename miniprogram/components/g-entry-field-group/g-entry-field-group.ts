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
        /** 是否检查 key 值 */
        checkkey: { type: Boolean, value: false },
        /** 是否支持拖动, 修改位置, 拖动的时候切换为普通模式 */
        drag: { type: Boolean, value: true },
        /** add:添加条目, edit:编辑条目, show:展示条目 */
        type: { type: String, value: 'show' }
    },
    /** 组件的内部数据 */
    data: {
        /** 打开移动 */
        openWinMove: false,
        /** 默认的icon图标 */
        movelist: [],
        /** 默认的icon图标 */
        warningkey: new Array<any>(),
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        /** 实例进入页面节点树时执行),可以setData */
        attached() {
            // $g.log('[组件][Entry-Field-Group]创建', this.data);
            this.checkKeyFun()
        }
    },
    /** 组件的方法列表 */
    methods: {
        fieldchange(e: any) {
            // $g.log('[组件][Entry-Group]', e)
            const info: any = e.detail
            this.data.list[info.index] = e.detail
            this.checkKeyFun()
            this.triggerEvent('change', this.data.list);
        },
        /** 请求移动的时候, 弹出简洁版样式, icon : title */
        fieldMove(e: any) {
            this.setData({
                movelist: JSON.parse(JSON.stringify(this.data.list)),
                openWinMove: true
            })
        },
        indexChange(e: any) {
            $g.log('[组件][Entry-Group]', e)
            this.data.list = e.detail
            this.setData({ list: this.data.list })
            this.triggerEvent('change', this.data.list);
        },
        /** 父列表删除一个字段 */
        fieldDel(e: any) {
            const info: any = e.detail
            this.data.list.splice(info.index, 1)
            for (let i = 0; i < this.data.list.length; i++) {
                const item: any = this.data.list[i]
                item.index = i
            }
            this.checkKeyFun()
            this.setData({ list: this.data.list })
            this.triggerEvent('change', this.data.list);
        },
        /** 检查 key 有没重复 */
        checkKeyFun() {
            if (this.data.checkkey) {
                const firstKey: Array<string> = ['title', 'username', 'password', 'url', 'notes']
                // --------- 查找重命名的
                let keyName: Array<string> = new Array<string>()
                let keyLen: Array<number> = new Array<number>()
                let keyLib: Array<Array<number>> = new Array<Array<number>>()
                this.data.warningkey.length = 0
                for (let i = 0; i < this.data.list.length; i++) {
                    const info: any = this.data.list[i]
                    this.data.warningkey.push(false)
                    if (info.key === '') {
                        this.data.warningkey[i] = true
                    } else if (firstKey.indexOf(info.key.toLocaleLowerCase()) !== -1) {
                        this.data.warningkey[i] = true
                    } else {
                        let keyIndex: number = keyName.indexOf(info.key.toLocaleLowerCase())
                        if (keyIndex === -1) {
                            keyName.push(info.key.toLocaleLowerCase())
                            keyLen.push(1)
                            keyLib.push([i])
                        } else {
                            keyLen[keyIndex] = keyLen[keyIndex] + 1
                            keyLib[keyIndex].push(i)
                        }
                    }
                }
                for (let i = 0; i < keyName.length; i++) {
                    if (keyLen[i] > 1) {
                        for (let j = 0; j < keyLib[i].length; j++) {
                            this.data.warningkey[keyLib[i][j]] = true
                        }
                    }
                }
                this.setData({ warningkey: this.data.warningkey })
            }
        }
    },
})
