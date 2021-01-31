import { $g } from "../../frame/speed.do"
import { WXFile } from "./../../frame/wx/wx.file"
import { KdbxApi } from "../../lib/g-data-lib/kdbx.api"
import { Kdbx } from "../../lib/kdbxweb/types/index"
import { WXSoterAuth } from "../../frame/wx/wx.soter.auth"
import { WXSize } from "../../frame/wx/wx.resize"
import { GFileSize } from "../../lib/g-byte-file/g.file.size"
import { WXKeepScreen } from "../../frame/wx/wx.keep.screen"
import { DBLib } from "../../lib/g-data-lib/db.lib"
import { DBItem } from "../../lib/g-data-lib/db.item"

/** 选中的档案信息 */
let selectItem: DBItem | null = null

//https://developers.weixin.qq.com/miniprogram/dev/extended/weui/tabbar.html
/**
 * 手机端设置 "pageOrientation": "auto" 或 iPad 上设置 "resizable": true 时会允许屏幕旋转，
 * 此时使用 Page 的 onResize 事件或者 wx.onWindowResize 方法可对该操作进行监听，
 * 进而判断是使用横屏还是竖屏布局。
 */
/**
 * GET参数:
 * isCreat : 强制进 1 创建 或 2 打开
 */
Page({
    data: {
        isCreatPage: true,
        creatSwiperIndex: 0,
        /** 创建, 导入, 打开的密码 */
        passWord: '',
        /** 选中档案的名称 */
        selectName: '',
        dbName: '查询出要进入的库',
        /** 本地档案库的数量 */
        dbLength: 0,
        /** 步进器 是否打开 */
        stepOpen: false,
        /** 步进器 内容 {icon:string, title:string, note:string} */
        stepList: []
    },
    onResize() {
        WXSize.getSize()
    },
    onLoad(query: any) {
        const dbLib: DBLib = $g.g.dbLib
        const dbItem: DBItem | null = dbLib.selectDB
        if (dbItem) {
            this.setData({
                dbName: dbItem.name,
                dbLength: dbLib.lib.length,
                isCreatPage: false
            })
        }
        $g.log('onLoad GET : ', query);
        if ($g.hasKey(query, 'isCreat')) {
            this.setData({ isCreatPage: Number(query.isCreat) === 1 ? true : false })
        }
        // this.fileFindInDir()
        // this.autoLoad()
        this.autoDown()
    },
    async autoDown() {
        const dbLib: DBLib = $g.g.dbLib
        const dbItem: DBItem | null = dbLib.selectDB
        if (dbItem) {
            await WXFile.openDocument(`db/${dbItem.path}/db.kdbx`)
        }
    },
    async autoLoad() {
        this.setData({ passWord: this.data.passWord })
        await this.btOpenSelectFile(null)
    },
    /** 用户选择一个文件 */
    async btSelectFile(e: any) {
        $g.log('选择文件');
        const dbLib: DBLib = $g.g.dbLib
        const fileFree: number = dbLib.fileSizeMax - dbLib.fileSizeAll
        const chooseList: WechatMiniprogram.ChooseFile[] = await WXFile.chooseFile(1);
        if (chooseList.length) {
            const chooseFile: WechatMiniprogram.ChooseFile = chooseList[0];
            if ((chooseFile.size * 2) < dbLib.fileSizeMax - dbLib.fileSizeAll) {
                const dbItem: DBItem = new DBItem()
                dbItem.name = chooseFile.name
                dbItem.localId = new Date().getTime()
                dbItem.path = dbItem.localId.toString()
                dbItem.timeChange = new Date()
                dbItem.filename = chooseFile.name
                dbItem.fileSizeAll = chooseFile.size
                if (await WXFile.saveFile(chooseFile.path, `db/${dbItem.path}/db.kdbx`)) {
                    selectItem = dbItem
                    dbLib.lib.push(selectItem)
                    dbLib.storageSaveThis()
                    this.setData({ selectName: dbItem.name })
                } else {
                    const allFileSize: number = await WXFile.getFileSize('', true)
                    $g.log('本地文件尺寸 : ' + GFileSize.getSize(allFileSize))
                }
            } else {
                wx.showToast({ title: `本地空间不足, 剩余空间 ${GFileSize.getSize(fileFree)}, 文件大小 ${GFileSize.getSize(chooseFile.size)}, 文件周转空间 ${GFileSize.getSize(chooseFile.size)}`, icon: 'none', mask: true })
            }
        }
    },
    async btOpenSelectFile(e: any) {
        console.log('打开文件 : ', selectItem);
        await this.openDbItem(selectItem)
    },
    async btOpenSelectDb(e: any) {
        const dbLib: DBLib = $g.g.dbLib
        const dbItem: DBItem | null = dbLib.selectDB
        await this.openDbItem(dbItem)
    },
    async openDbItem(dbItem: DBItem | null) {
        if (dbItem) {
            if (this.data.passWord) {
                if (dbItem.db) {
                    wx.reLaunch({ url: './../showdb/index/index' })
                } else {
                    // 关闭已经打开的库
                    await WXKeepScreen.on()
                    const dbLib: DBLib = $g.g.dbLib
                    const findOpen: DBItem | null = dbLib.selectDB
                    if (findOpen && findOpen.localId !== dbItem.localId) {
                        findOpen.db = null
                    }
                    const readByte: string | ArrayBuffer | null = await WXFile.readFile(`db/${dbItem.path}/db.kdbx`);
                    console.log('文件读入内存 : ', readByte);
                    if (readByte && $g.isTypeM(readByte, 'ArrayBuffer')) {
                        const db: Kdbx | null = await KdbxApi.open(readByte as any, this.data.passWord);
                        if (db) {
                            dbItem.db = db
                            // ----- 查询 db 中有没有附件, 有就对db进行拆解, 在保存
                            await dbItem.getFileToDisk()
                            await WXKeepScreen.off()
                            wx.reLaunch({ url: './../showdb/index/index' })
                            return
                        } else {
                            wx.showToast({ title: '打开文件失败, 请检查密码!', icon: 'none', mask: true })
                        }
                    }
                    await WXKeepScreen.off()
                }
            } else {
                wx.showToast({ title: '请输入文件密码!', icon: 'none', mask: true })
            }
        } else {
            wx.showToast({ title: '未找到选择的档案!', icon: 'none', mask: true })
        }
    },
    creatNewFile(e: any) {
        const that: any = this
        wx.showModal({
            title: '提示',
            content: '丢失密码, 档案数据将丢失, 请务必牢记, 当前密码 : ' + this.data.passWord,
            async success(e) {
                if (e.confirm) {
                    $g.log('g|time|start')
                    await WXKeepScreen.on()
                    const db: Kdbx = KdbxApi.create('我的密码档案', that.data.passWord)
                    that.setData({ passWord: '' })
                    $g.log('获取 db 二进制')
                    const fileByte: ArrayBuffer = await KdbxApi.save(db)
                    $g.log('创建 db 信息')
                    const dbItem: DBItem = new DBItem()
                    dbItem.localId = new Date().getTime()
                    dbItem.db = db
                    dbItem.name = '我的密码档案'
                    dbItem.filename = 'db'
                    dbItem.path = dbItem.localId.toString()
                    dbItem.timeCreat = new Date()
                    dbItem.timeChange = dbItem.timeCreat
                    dbItem.timeRead = dbItem.timeCreat
                    $g.log('写入文件系统')
                    if (await WXFile.writeFile(`db/${dbItem.path}/db.kdbx`, fileByte)) {
                        $g.log('获取文件夹大小')
                        await dbItem.fileSize()
                        const dbLib: DBLib = $g.g.dbLib
                        dbLib.fileSize()
                        dbLib.lib.push(dbItem)
                        $g.log('保存缓存')
                        dbLib.storageSaveThis()
                        $g.log('g|time|end')
                        await WXKeepScreen.off()
                        // 切换页面
                        wx.reLaunch({
                            url: './../showdb/index/index'
                        })
                        return
                    }
                    await WXKeepScreen.off()
                } else {
                    that.setData({ passWord: '' })
                }
            }
        })
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
        wx.navigateTo({
            url: './../showdb/dblist/dblist'
        })
    }
})
