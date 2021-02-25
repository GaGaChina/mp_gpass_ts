import { AES } from "../../frame/crypto/AES"
import { $g } from "../../frame/speed.do"
import { WXSoterAuth } from "../../frame/wx/wx.soter.auth"
import { DBItem, DBLib } from "../../lib/g-data-lib/db"
import { KdbxApi } from "../../lib/g-data-lib/kdbx.api"

/**
 * 组件 : 弹出添加 Face Id 的界面
 */
Component({
    options: {
        styleIsolation: 'isolated',
    },
    /** 组件属性列表 properties和data指向同对象, 可定义函数 */
    properties: {
        open: { type: Boolean, value: false },// 默认是否为关闭
    },
    /** 组件的内部数据 */
    data: {
        sceneHeight: 0,
        topHeight: 0,
        centerHeight: 800,
        endHeight: 0,
        passLength: 12,
        passABC: true,
        passMinABC: true,
        pass123: true,
        passTe: false,
        passKuoHao: false,
        passOo: false,
        pass: '',
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        /** 实例进入页面节点树时执行),可以setData */
        attached() {
            const scene: DataScene = $g.g.app.scene
            this.setData({
                sceneHeight: scene.winHeight,
                topHeight: (scene.winHeight - this.data.centerHeight) / 2,
                endHeight: (scene.winHeight - this.data.centerHeight) / 2,
            })
            this.creatPass()
        },
    },
    /** 组件的方法列表 */
    methods: {
        async btOpen(e: any) {
            const dbLib: DBLib = $g.g.dbLib
            const dbItem: DBItem | null = dbLib.selectItem
            if (dbItem && dbItem.db && dbItem.pass.facial === '' && dbItem.pass.pv) {
                let o: string | null = await WXSoterAuth.start(['facial'])
                if (o && o.length) {
                    let key: string = o + '|dbid:' + dbItem.localId.toString()
                    const aesObj:AES = new AES()
                    await aesObj.setKey(key)
                    let pass: string = dbItem.pass.pv.getText()
                    let passJM: ArrayBuffer | null = await aesObj.encryptCBC(pass, o)
                    await aesObj.setKey('')
                    if (passJM) {
                        dbItem.pass.facial = KdbxApi.kdbxweb.ByteUtils.bytesToBase64(passJM)
                        if (WXSoterAuth.fingerPrint === false || dbItem.pass.fingerPrint !== '') {
                            dbItem.pass.pv = null
                        }
                        dbLib.storageSaveThis()
                    }
                }
                o = ''
            }
            this.setData({ open: false })
        },
        /** 修改密码长度 */
        infoChange() {
            this.creatPass()
        },
        creatPass(): void {
            const max: string = 'ABCDEFGHIJKLMNPQRSTUVWXYZ'
            const min: string = 'abcdefghijklmnpqrstuvwxyz'
            const math: string = '123456789'
            const te: string = '!@#$%^&*-_=+~`?,.:;\'"'
            const kuohao: string = '()[]{}<>'
            const oo: string = '0oO'
            let run: string = ''
            let out: string = ''
            let minLength: number = 0
            if (this.data.passABC) {
                run += max
                minLength++
            }
            if (this.data.passMinABC) {
                run += min
                minLength++
            }
            if (this.data.pass123) {
                run += math
                minLength++
            }
            if (this.data.passTe) {
                run += te
                minLength++
            }
            if (this.data.passKuoHao) {
                run += kuohao
                minLength++
            }
            if (this.data.passOo) {
                run += oo
                minLength++
            }
            let passLen: number = this.data.passLength
            if (minLength > passLen) {
                this.setData({ pass: out })
                wx.showToast({ title: '密码长度必须大于选中种类长度', icon: 'none', mask: false })
                return
            }
            if (run.length) {
                if (this.data.passABC) {
                    let index: number = ~~(Math.random() * max.length)
                    out += max.substr(index, 1)
                }
                if (this.data.passMinABC) {
                    let index: number = ~~(Math.random() * min.length)
                    out += min.substr(index, 1)
                }
                if (this.data.pass123) {
                    let index: number = ~~(Math.random() * math.length)
                    out += math.substr(index, 1)
                }
                if (this.data.passTe) {
                    let index: number = ~~(Math.random() * te.length)
                    out += te.substr(index, 1)
                }
                if (this.data.passKuoHao) {
                    let index: number = ~~(Math.random() * kuohao.length)
                    out += kuohao.substr(index, 1)
                }
                if (this.data.passOo) {
                    let index: number = ~~(Math.random() * oo.length)
                    out += oo.substr(index, 1)
                }
                while (out.length < passLen) {
                    let index: number = ~~(Math.random() * run.length)
                    out += run.substr(index, 1)
                }
                while (--passLen < -1) {
                    let index: number = ~~(Math.random() * out.length)
                    if (index > 0) {
                        run = run.slice(index) + run.slice(0, index)
                    }
                }
            }
            $g.g.app.timeMouse = Date.now()
            this.setData({ pass: out })
        },
        inputValChange(e: any) {
            if (this.data.pass !== e.detail.value) {
                $g.g.app.timeMouse = Date.now()
                this.data.pass = e.detail.value
            }
        },
        btUsePass() {
            this.triggerEvent('pass', { pass: this.data.pass })
            this.setData({ open: false })
        },
        btClose(e: any) {
            this.setData({ open: false })
        }
    },
})
