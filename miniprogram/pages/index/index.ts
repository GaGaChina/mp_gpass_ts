import { $g } from "../../frame/speed.do";
import { WXFile } from "./../../frame/wx/wx.file";
import { KdbxApi } from "../../lib/g-data-lib/kdbx.api";
import { Kdbx } from "../../lib/kdbxweb/types/index";
import { WXSoterAuth } from "../../frame/wx/wx.soter.auth";
import { EncodingIndexes } from "../../lib/text-encoding/EncodingIndexes";
import { WXSize } from "../../frame/wx/wx.resize";

//https://developers.weixin.qq.com/miniprogram/dev/extended/weui/tabbar.html
/**
 * 手机端设置 "pageOrientation": "auto" 或 iPad 上设置 "resizable": true 时会允许屏幕旋转，
 * 此时使用 Page 的 onResize 事件或者 wx.onWindowResize 方法可对该操作进行监听，
 * 进而判断是使用横屏还是竖屏布局。
 */
/**

 */
Page({
    data: {
        isCreatPage: true,
        creatSwiperIndex: 0,
        passWord: '',// 创建, 导入, 打开的密码
        selectFilePath: '',// 选择的文件

    },
    onResize() {
        WXSize.getSize()
        const y: number = $g.globalData.app.scene.winHeight - $g.globalData.app.scene.endBarHeight - $g.globalData.app.scene.topBarHeight
        const h: number = $g.globalData.app.scene.endBarHeight
    },
    onLoad() {
        this.fileFindInDir()
    },
    /** 用户选择一个文件 */
    async btSelectFile(e: any) {
        console.log(e);
        const chooseList: WechatMiniprogram.ChooseFile[] = await WXFile.chooseFile();
        if (chooseList.length) {
            for (let i: number = 0; i < chooseList.length; i++) {
                const chooseFile: WechatMiniprogram.ChooseFile = chooseList[i];
                console.log('处理文件 : ', chooseFile);
                if (await WXFile.saveFile(chooseFile.path, chooseFile.name)) {
                    this.fileFindInDir()
                }
            }
        }
    },
    async fileFindInDir() {
        const dirList: string[] = await WXFile.readdir();
        console.log('目录下的文件 : ', dirList);
        for (let i = 0; i < dirList.length; i++) {
            const filePath = dirList[i];
            if (filePath.indexOf('.kdbx') != -1) {
                console.log('找到文件 : ', filePath);
                this.setData({ selectFilePath: filePath })
                return;
            }
        }
    },
    async btOpenSelectFile(e: any) {
        console.log('打开文件 : ', this.data.selectFilePath);
        if (this.data.selectFilePath) {
            if (this.data.passWord) {
                const readByte: string | ArrayBuffer | null = await WXFile.readFile(this.data.selectFilePath);
                if (readByte) {
                    const db: Kdbx = await KdbxApi.open(readByte as ArrayBuffer, this.data.passWord);
                    console.log(db);
                }
            } else {
                wx.showToast({
                    title: '请输入文件密码!',
                    icon: 'none',
                    mask: true
                })
            }
        } else {
            wx.showToast({
                title: '未找到可用的本地文件!',
                icon: 'none',
                mask: true
            })
        }

    },
    creatNewFile(e: any) {
        const that: any = this
        wx.showModal({
            title: '提示',
            content: '丢失密码, 档案数据将丢失, 请务必牢记, 当前密码 : ' + this.data.passWord,
            success(e) {
                if (e.confirm) {
                    const db: Kdbx = KdbxApi.create('我的密码档案', that.data.passWord)
                    that.setData({ passWord: '' })
                    $g.globalData.db = db
                    wx.reLaunch({
                        url: './../showdb/index/index'
                    })
                    // 切换页面
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

    bt_JY() {
        EncodingIndexes.init({})
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
    }
})
