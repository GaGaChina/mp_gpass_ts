import { AES } from "../../frame/crypto/AES"
import { $g } from "../../frame/speed.do"
import { WXSoterAuth } from "../../frame/wx/wx.soter.auth"
import { DBItem, DBLib } from "../../lib/g-data-lib/db"
import { DBLibApi } from "../../lib/g-data-lib/db.lib.api"
import { KdbxApi } from "../../lib/g-data-lib/kdbx.api"

/**
 * 组件 : 弹出添加 Face Id 的界面
 */
Component({
    options: {
        multipleSlots: true,
        styleIsolation: 'isolated',
    },
    /** 组件属性列表 properties和data指向同对象, 可定义函数 */
    properties: {
        open: { type: Boolean, value: true },// 默认是否为关闭
    },
    /** 组件的内部数据 */
    data: {
        sceneHeight: 0,
        topHeight: 0,
        centerHeight: 600,
        endHeight: 0,
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
        },
    },
    /** 组件的方法列表 */
    methods: {
        async btOpen(e: any) {
            const dbLib:DBLib = $g.g.dbLib
            const dbItem:DBItem | null = dbLib.selectItem
            if(dbItem && dbItem.db && dbItem.pass.facial === '' && dbItem.pass.pv){
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
                        DBLibApi.storageSave(dbLib)
                    }
                }
                o = ''
            }
            this.setData({ open: false })
        },
        btClose(e: any) {
            this.setData({ open: false })
        }
    },
})
