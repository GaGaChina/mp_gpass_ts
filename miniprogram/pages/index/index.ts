import { $g } from "../../frame/speed.do"
import { WXFile } from "./../../frame/wx/wx.file"
import { WXSize } from "../../frame/wx/wx.resize"
import { WXSoterAuth } from "../../frame/wx/wx.soter.auth"
import { WXSystemInfo } from "../../frame/wx/wx.system.info"
import { KdbxApi } from "../../lib/g-data-lib/kdbx.api"
import { Kdbx, ProtectedValue } from "../../lib/kdbxweb/types/index"
import { GFileSize } from "../../lib/g-byte-file/g.file.size"
import { DBItem, DBLib } from "../../lib/g-data-lib/db"
import { EncodingText } from "../../lib/text-encoding/EncodingText"
import { AES } from "../../frame/crypto/AES"
import { WXKeepScreen } from "../../frame/wx/wx.keep.screen"
import { WXShare, WXShareData } from "../../frame/wx/wx.share"
import { DBItemApi } from "../../lib/g-data-lib/db.item.api"
import { DBLibApi } from "../../lib/g-data-lib/db.lib.api"

var passPV: ProtectedValue;

//https://developers.weixin.qq.com/miniprogram/dev/extended/weui/tabbar.html
/**
 * 手机端设置 "pageOrientation": "auto" 或 iPad 上设置 "resizable": true 时会允许屏幕旋转，
 * 此时使用 Page 的 onResize 事件或者 wx.onWindowResize 方法可对该操作进行监听，
 * 进而判断是使用横屏还是竖屏布局。
 */
/**
 * GET参数:
 * isCreat : 强制进 1 创建 或 2 打开
 * 
 * 普通密码 abc
 */
Page({
    data: {
        isCreatPage: true,
        creatSwiperIndex: 0,
        /** 是否支持人脸识别 */
        facial: WXSoterAuth.facial,
        /** 是否支持指纹识别 */
        fingerPrint: WXSoterAuth.fingerPrint,
        /** 是否开启人脸识别 */
        isFacial: false,
        /** 是否开启指纹识别 */
        isFingerPrint: false,
        /** 打开 facial 的时间 */
        facialTime: 0,
        /** 正在打开验证 */
        facialStart: false,
        /** 创建, 导入, 打开的密码 */
        passWord: '',
        /** 选中档案的名称 */
        selectName: '',
        dbName: '查询出要进入的库',
        /** 本地档案库的数量 */
        dbLength: 0,
    },
    onResize() {
        $g.g.systemInfo = WXSystemInfo.getSync()
        WXSize.getSize($g.g.systemInfo)
    },
    onLoad(query: any) {
        const scene: DataScene = $g.g.app.scene
        if (scene.endBarHeight > 0) {
            $g.g.systemInfo = WXSystemInfo.getSync()
            WXSize.getSize($g.g.systemInfo)
        }
        const dbItem: DBItem | null = $g.g.dbLib.selectItem
        if (dbItem) {
            this.setData({
                isCreatPage: false,
                facial: WXSoterAuth.facial,
                fingerPrint: WXSoterAuth.fingerPrint,
            })
        }
        $g.log('onLoad GET : ', query);
        if ($g.hasKey(query, 'isCreat')) {
            this.setData({ isCreatPage: Number(query.isCreat) === 1 ? true : false })
        }
        // ----------------测试
        // this.demo()
    },
    // async demo() {
    // },
    onShow() {
        $g.step.clear()
        this.autoOpen()
    },
    /** 用户分享的信息 */
    onShareAppMessage(e: any): any {
        $g.log('用户点击分享:', e)
        const shareData: WXShareData = new WXShareData()
        shareData.title = '密码档案'
        shareData.desc = '记录帐号密码的好工具'
        shareData.path = '/pages/index/index'
        shareData.imageUrl = '/img/share/home.jpg'
        return WXShare.runObj(shareData);
    },
    async autoOpen() {
        const dbLib: DBLib = $g.g.dbLib
        const dbItem: DBItem | null = dbLib.selectItem
        if (dbItem) {
            this.setData({
                dbName: dbItem.name,
                dbLength: dbLib.lib.length,
                isFacial: dbItem.pass.facial.length > 0,
                isFingerPrint: dbItem.pass.fingerPrint.length > 0,
            })
            // 自动解锁进入
            if (!this.data.isCreatPage) {
                if (dbItem.db === null) {
                    this.data.facialStart = true
                    const newTime: number = new Date().getTime()
                    if ((this.data.facialTime + 5000) < newTime) {
                        if (this.data.isFacial) {
                            await this.btOpenSelectDbFace()
                        } else if (this.data.isFingerPrint) {
                            await this.btOpenSelectDbPrint()
                        }
                        this.data.facialTime = new Date().getTime()
                    }
                    this.data.facialStart = false
                } else {
                    $g.g.app.timeMouse = Date.now()
                    wx.reLaunch({ url: './../showdb/index/index' })
                }
            }
        }
    },
    /** 用户选择一个文件 */
    async btUploadFile(e: any) {
        // $g.log('选择文件');
        $g.step.clear()
        $g.step.add('选择导入文件')
        $g.step.add('检查本地剩余空间是否满足')
        $g.step.add('创建本地档案信息')
        $g.step.add('保存选择文件到本地')
        $g.step.add('删除临时文件')
        $g.step.add('保存档案信息到本地')
        await $g.step.jump(0)
        const dbLib: DBLib = $g.g.dbLib
        const fileFree: number = 1024 * 1024 * 200 - dbLib.count.sizeFolder
        const chooseList: WechatMiniprogram.ChooseFile[] = await WXFile.chooseFile(1);
        if (chooseList.length) {
            const chooseFile: WechatMiniprogram.ChooseFile = chooseList[0]
            await $g.step.next()
            if ((chooseFile.size * 2) < 1024 * 1024 * 200 - dbLib.count.sizeFolder) {
                await $g.step.next()
                let name: string = this.clearFileName(chooseFile.name)
                const dbItem: DBItem = new DBItem()
                dbItem.name = name
                dbItem.localId = new Date().getTime()
                dbItem.path = dbItem.localId.toString()
                dbItem.count.timeChange = new Date()
                dbItem.filename = chooseFile.name
                dbItem.count.sizeFolder = chooseFile.size
                await $g.step.next()
                if (await WXFile.saveFile(chooseFile.path, `db/${dbItem.path}/db.kdbx`)) {
                    await $g.step.next()
                    await WXFile.clearTempFile(chooseFile.path)
                    dbLib.lib.push(dbItem)
                    dbLib.selectId = dbItem.localId
                    await $g.step.next()
                    DBLibApi.storageSave(dbLib)
                    this.setData({ selectName: dbItem.name })
                    await $g.step.clear()
                } else {
                    await $g.step.clear()
                    const allFileSize: number = await WXFile.getFileSize('', true)
                    $g.log('本地文件尺寸 : ' + GFileSize.getSize(allFileSize))
                }
            } else {
                await $g.step.clear()
                wx.showToast({ title: `本地空间不足, 剩余空间 ${GFileSize.getSize(fileFree)}, 文件大小 ${GFileSize.getSize(chooseFile.size)}, 文件周转空间 ${GFileSize.getSize(chooseFile.size)}`, icon: 'none' })
            }
        } else {
            await $g.step.clear()
            wx.showToast({ title: '请先选择一个本地文件', icon: 'none' })
        }
    },
    /** 去掉文件后面的扩展名 */
    clearFileName(name: string): string {
        const clear: Array<string> = ['.kdbx', '.doc', '.xml', '.txt', '.csv', '.xls']
        let change: boolean = false
        for (let i = 0; i < clear.length; i++) {
            const clearName = clear[i]
            if (name.length > clearName.length) {
                if (name.substr(name.length - clearName.length, clearName.length) === clearName) {
                    name = name.substring(0, name.length - clearName.length)
                    change = true
                }
            }
        }
        if (change) {
            name = this.clearFileName(name)
        }
        return name
    },
    /** 使用 data 的 passWord 打开默认选中的档案 */
    async btOpenSelectDb() {
        if (this.checkPassWord() === false) {
            return;
        }
        await this.openDbItem($g.g.dbLib.selectItem)
    },
    /** 使用 FaceID 解锁密码库 */
    async btOpenSelectDbFace() {
        const dbItem: DBItem | null = $g.g.dbLib.selectItem
        if (dbItem && dbItem.pass.facial) {
            $g.step.clear()
            $g.step.add('获取人脸信息')
            $g.step.add('获取加密指令')
            $g.step.add('打开本地档案')
            await $g.step.jump(0)
            let o: string | null = await WXSoterAuth.start(['facial'])
            if (o && o.length) {
                await $g.step.next()
                let key: string = o + '|dbid:' + dbItem.localId.toString()
                const aesObj: AES = new AES()
                await aesObj.setKey(key)
                let passBase64: string = dbItem.pass.facial
                let passU8: Uint8Array = KdbxApi.kdbxweb.ByteUtils.base64ToBytes(passBase64)
                let passJM: ArrayBuffer | null = await aesObj.decryptCBC(passU8, o)
                await aesObj.setKey('')
                if (passJM) {
                    let pass: string = EncodingText.decode(new Uint8Array(passJM))
                    passPV = KdbxApi.getPassPV(pass)
                    pass = ''
                    await $g.step.next()
                    await this.openDbItem(dbItem)
                } else {
                    wx.showToast({ title: '解密失败!', icon: 'none' })
                }
            }
            o = ''
            $g.step.clear()
        }
    },
    /** 使用 指纹 解锁密码库 */
    async btOpenSelectDbPrint() {
        const dbItem: DBItem | null = $g.g.dbLib.selectItem
        if (dbItem && dbItem.pass.fingerPrint) {
            $g.step.clear()
            $g.step.add('获取指纹信息')
            $g.step.add('获取加密指令')
            $g.step.add('打开本地档案')
            await $g.step.jump(0)
            let o: string | null = await WXSoterAuth.start(['fingerPrint'])
            if (o && o.length) {
                await $g.step.next()
                let key: string = o + '|dbid:' + dbItem.localId.toString()
                const aesObj: AES = new AES()
                await aesObj.setKey(key)
                let passBase64: string = dbItem.pass.fingerPrint
                let passU8: Uint8Array = KdbxApi.kdbxweb.ByteUtils.base64ToBytes(passBase64)
                let passJM: ArrayBuffer | null = await aesObj.decryptCBC(passU8, o)
                await aesObj.setKey('')
                if (passJM) {
                    let pass: string = EncodingText.decode(new Uint8Array(passJM))
                    passPV = KdbxApi.getPassPV(pass)
                    pass = ''
                    await $g.step.next()
                    await this.openDbItem(dbItem)
                } else {
                    wx.showToast({ title: '解密失败!', icon: 'none', mask: true })
                }
            }
            o = ''
            $g.step.clear()
        }
    },
    async openDbItem(dbItem: DBItem | null) {
        if (dbItem) {
            if (passPV && passPV.getText().length > 0) {
                if (dbItem.db) {
                    $g.g.app.timeMouse = Date.now()
                    wx.reLaunch({ url: './../showdb/index/index' })
                } else {
                    const findOpen: DBItem | null = $g.g.dbLib.selectItem
                    // 关闭已经打开的库
                    if (findOpen && findOpen.localId !== dbItem.localId) {
                        findOpen.db = null
                        await WXFile.rmDir('temp', true)
                    }
                    await WXKeepScreen.on()
                    try {
                        await DBItemApi.open(dbItem, passPV)
                    } catch (e) {
                        wx.showModal({ title: '错误', content: '解密仓库失败,请确认密码!', showCancel: false })
                    }
                    await WXKeepScreen.off()
                    if (dbItem.db) {
                        $g.g.app.timeMouse = Date.now()
                        wx.reLaunch({ url: './../showdb/index/index' })
                    }
                }
            } else {
                wx.showToast({ title: '请输入文件密码!', icon: 'none' })
            }
        } else {
            wx.showModal({ title: '错误', content: '未找到选择的档案!', showCancel: false })
        }
        await $g.step.clear()
    },
    /** 创建一个新库 */
    creatNewFile(e: any) {
        $g.log('创建新仓库')
        if (this.checkPassWord() === false) return;
        const that: any = this
        wx.showModal({
            title: '提示',
            content: '丢失密码, 档案数据将丢失, 请务必牢记, 当前密码 : ' + passPV.getText(),
            async success(e) {
                if (e.confirm) {
                    $g.log('g|time|start')
                    $g.step.clear()
                    $g.step.add('创建档案')
                    $g.step.add('创建记录')
                    $g.step.add('保存档案')
                    await $g.step.jump(0)
                    const db: Kdbx = KdbxApi.create('我的密码档案', passPV.getText())
                    const pv: ProtectedValue = KdbxApi.getPassPV(passPV.getText())
                    await $g.step.next()
                    $g.log('创建 db 信息')
                    const dbItem: DBItem = new DBItem()
                    dbItem.localId = new Date().getTime()
                    dbItem.db = db
                    dbItem.name = '我的密码档案'
                    dbItem.filename = 'db'
                    dbItem.path = dbItem.localId.toString()
                    dbItem.count.timeCreat = new Date()
                    dbItem.count.timeChange = dbItem.count.timeCreat
                    dbItem.count.timeRead = dbItem.count.timeCreat
                    dbItem.pass.pv = pv
                    const dbLib: DBLib = $g.g.dbLib
                    dbLib.lib.push(dbItem)
                    dbLib.selectId = dbItem.localId
                    $g.log('保存缓存')
                    await $g.step.next()
                    await DBItemApi.saveFileAddStorage(dbLib, dbItem)
                    $g.log('g|time|end')
                    // 切换页面
                    await $g.step.clear()
                    $g.g.app.timeMouse = Date.now()
                    wx.reLaunch({ url: './../showdb/index/index' })
                } else {
                    that.setData({ passWord: '' })
                }
            }
        })
    },
    /** 检查密码是否合法, true 通过, false 未通过 */
    checkPassWord(): boolean {
        // 去除字符串的头尾空格
        let pass: string = this.data.passWord.trim()
        if (pass.length > 0) {
            passPV = KdbxApi.getPassPV(pass)
            this.setData({ passWord: '' })
            pass = ''
            return true
        }
        wx.showToast({ title: '请先设置密码!', icon: 'none' })
        return false
    },
    /** 指纹识别 */
    rz_zw() {
        WXSoterAuth.start(['fingerPrint'])
    },
    /** 人脸识别 */
    rz_face() {
        WXSoterAuth.start(['facial'])
    },
    /** 密码输入框内容 */
    passChange(e: any) {
        this.setData({ passWord: e.detail.value })
    },
    /** Swiper 切换的时候 */
    btSwiperChange(e: any) {
        console.log(e);
        if (e.type === 'tap') {
            let index: number = Number(e.currentTarget.dataset.id)
            if (index > 1) index = 1
            if (index < 0) index = 0
            this.setData({ creatSwiperIndex: index })
        } else if (e.type === 'change') {
            this.setData({ creatSwiperIndex: e.detail.current })
        }
    },
    /** 切换 新建 和 档案选择 */
    btChangePage() {
        this.setData({ isCreatPage: !this.data.isCreatPage })
    },
    /** 打开本地数据库列表 */
    btShowDBList() {
        wx.navigateTo({ url: './../showdb/dblist/dblist' })
    }
})
