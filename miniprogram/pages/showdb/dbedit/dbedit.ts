import { $g } from "../../../frame/speed.do"
import { GFileSize } from "../../../lib/g-byte-file/g.file.size"
import { DBItem, DBLib } from "../../../lib/g-data-lib/db"
import { Kdbx } from "../../../lib/kdbxweb/types"
import { WXSoterAuth } from "./../../../frame/wx/wx.soter.auth"
import { WXFile } from "./../../../frame/wx/wx.file"
import { AES } from "../../../frame/crypto/AES"
import { KdbxApi } from "../../../lib/g-data-lib/kdbx.api"
import { TimeFormat } from "../../../frame/time/time.format"
import { DBLibApi } from "../../../lib/g-data-lib/db.lib.api"
import { DBItemCheckApi } from "../../../lib/g-data-lib/db.item.check.api"

var dbLib: DBLib;
var dbItem: DBItem;

Page({
    data: {
        fullPageHeight: 0,
        DEBUG: $g.g.app.DEBUG,
        /** 是否显示出密码输入界面 */
        passShow: false,
        /** 是否支持指纹识别 */
        fingerPrint: WXSoterAuth.fingerPrint,
        /** 是否支持人脸识别 */
        facial: WXSoterAuth.facial,
        /** 是否开启指纹识别 */
        isFingerPrint: false,
        /** 是否开启人脸识别 */
        isFacial: false,
        selectIndex: 0,
        dbLocalId: 0,
        icon: '',
        name: '',
        path: '',
        timeCreat: '',
        timeRead: '',
        timeChange: '',
        fileSize: '',
        fileSizeKdbx: '',
        isOpen: false,
        countEntry: 0,
        countGroup: 0,
    },
    onLoad(query: any) {
        // 获取尺寸
        const scene: DataScene = $g.g.app.scene
        const fullHeight: number = scene.winHeight - scene.topBarHeight - scene.topBarTop
        this.setData({ fullPageHeight: fullHeight })
        // 开始设置
        dbLib = $g.g.dbLib
        let item: DBItem | null = dbLib.selectItem
        $g.log('onLoad GET : ', query);
        if ($g.hasKey(query, 'id')) {
            const queryId: number = Number(query.id)
            if (item === null || item.localId !== queryId) {
                let itemQuery: DBItem | null = DBLibApi.getItem(dbLib, queryId)
                if (itemQuery) item = itemQuery
            }
        }
        this.loadItem(item)
    },
    onShow() {
        // 如果时间超过了, 就切换回其他的页面
        if ($g.g.app.timeMouse + $g.g.app.timeMouseClose < Date.now()) {
            if (dbItem && dbItem.db) {
                dbItem.db = null
                WXFile.rmDir('temp', true)
                wx.reLaunch({ url: './../../index/index' })
            }
        }
    },
    async loadItem(item: DBItem | null): Promise<any> {
        await WXSoterAuth.checkSupport();
        if (item) {
            dbItem = item
            $g.log('设置参数')
            await DBItemCheckApi.check(dbItem)
            const fileSize: string = GFileSize.getSize(dbItem.count.sizeFolder, 3)
            const fileSizeKdbx: string = GFileSize.getSize(dbItem.count.sizeKdbxByte, 3)
            this.setData({
                dbLocalId: dbItem.localId,
                icon: dbItem.icon,
                name: dbItem.name,
                path: dbItem.path,
                countEntry: dbItem.count.entry,
                countGroup: dbItem.count.group,
                isOpen: dbItem.db ? true : false,
                timeCreat: TimeFormat.showLang(dbItem.count.timeCreat),
                timeRead: TimeFormat.showLang(dbItem.count.timeRead),
                timeChange: TimeFormat.showLang(dbItem.count.timeChange),
                fileSize: fileSize,
                fileSizeKdbx: fileSizeKdbx,
                fingerPrint: WXSoterAuth.fingerPrint,
                facial: WXSoterAuth.facial,
                isFingerPrint: dbItem.pass.fingerPrint.length > 0,
                isFacial: dbItem.pass.facial.length > 0,
            })
        } else {
            $g.log('未找到操作库')
            wx.showToast({ title: '未找到可以操作的库!', icon: 'none' })
        }
        return null
    },
    /** 是否打开了输入密码的窗口 */
    inputPass(): boolean {
        if (dbItem.db === null) {
            this.setData({ passShow: true })
            return true
        }
        return false
    },
    btOpen(e: any) {
        const dbLib: DBLib = $g.g.dbLib
        if (dbLib.selectId !== this.data.dbLocalId) {
            dbLib.selectId = this.data.dbLocalId
            DBLibApi.storageSave(dbLib)
        }
        wx.reLaunch({
            url: './../../index/index?isCreat=0'
        })
    },
    /** 关闭现在打开的库 */
    btClose(e: any) {
        if (dbItem) {
            dbItem.db = null
            WXFile.rmDir('temp', true)
            this.setData({ isOpen: false })
        }
    },
    /** 删除这个库 */
    async btDel(e: any) {
        const that = this
        wx.showModal({
            title: '提示',
            content: '你确定删除库吗!',
            async success(e) {
                dbItem.db = null
                await WXFile.rmDir('temp', true)
                const dbLib: DBLib = $g.g.dbLib
                if (await DBLibApi.remove(dbLib, dbItem.localId) === false) {
                    wx.showToast({ title: '本地库删除失败', icon: 'none', mask: true })
                }
                if (that.data.dbLocalId === dbLib.selectId) {
                    // 找到最后一个为选中的库
                    if (dbLib.lib.length) {
                        const dbItem: DBItem = dbLib.lib[dbLib.lib.length - 1]
                        dbLib.selectId = dbItem.localId
                    } else {
                        dbLib.selectId = 0
                    }
                }
                wx.navigateBack();
            }
        })
    },
    async btChangePass(e: any) {
        if (!this.inputPass()) {
            if (dbItem.db) {
                const db: Kdbx = dbItem.db
                //db.credentials.setPassword()
                $g.log('[测试]', await db.credentials.getHash())
                $g.log('[测试]', db.credentials)
            } else {
                wx.showToast({ title: '未找到打开的数据库!', icon: 'none', mask: true })
            }
        }
    },
    /** 切换人脸 */
    async btChangeFacial(e: any) {
        if (this.data.isFacial) {
            dbItem.pass.facial = ''
            this.setData({ isFacial: dbItem.pass.facial.length > 0 })
            wx.showToast({ title: '已经关闭人脸解锁', icon: 'none', mask: true })
        } else {
            if (dbItem.pass.pv) {
                let o: string | null = await WXSoterAuth.start(['facial'])
                if (o && o.length) {
                    let key: string = o + '|dbid:' + dbItem.localId.toString()
                    const aesObj: AES = new AES()
                    await aesObj.setKey(key)
                    let pass: string = dbItem.pass.pv.getText()
                    let passJM: ArrayBuffer | null = await aesObj.encryptCBC(pass, o)
                    await aesObj.setKey('')
                    if (passJM) {
                        dbItem.pass.facial = KdbxApi.kdbxweb.ByteUtils.bytesToBase64(passJM)
                        if (WXSoterAuth.fingerPrint === false || dbItem.pass.fingerPrint !== '') {
                            dbItem.pass.pv = null
                        }
                        $g.g.dbLib.storageSaveThis()
                        this.setData({ isFacial: true })
                    } else {
                        wx.showToast({ title: '加密失败!', icon: 'none', mask: false })
                    }
                }
                o = ''
            } else {
                wx.showToast({ title: '需要输入密码才能进行设置!', icon: 'none', mask: false })
            }
        }
    },
    async btChangeFingerPrint(e: any) {
        if (this.data.isFingerPrint) {
            dbItem.pass.fingerPrint = ''
            this.setData({ isFingerPrint: dbItem.pass.fingerPrint.length > 0 })
            wx.showToast({ title: '已经关闭指纹解锁', icon: 'none', mask: true })
        } else {
            if (dbItem.pass.pv) {
                let o: string | null = await WXSoterAuth.start(['fingerPrint'])
                if (o && o.length) {
                    let key: string = o + '|dbid:' + dbItem.localId.toString()
                    const aesObj: AES = new AES()
                    await aesObj.setKey(key)
                    let pass: string = dbItem.pass.pv.getText()
                    let passJM: ArrayBuffer | null = await aesObj.encryptCBC(pass, o)
                    await aesObj.setKey('')
                    if (passJM) {
                        dbItem.pass.fingerPrint = KdbxApi.kdbxweb.ByteUtils.bytesToBase64(passJM)
                        if (WXSoterAuth.facial === false || dbItem.pass.facial !== '') {
                            dbItem.pass.pv = null
                        }
                        $g.g.dbLib.storageSaveThis()
                        this.setData({ isFingerPrint: true })
                    } else {
                        wx.showToast({ title: '加密失败!', icon: 'none', mask: false })
                    }
                }
                o = ''
            } else {
                wx.showToast({ title: '需要输入密码才能进行设置!', icon: 'none', mask: false })
            }
        }
    },
    /** 保存文件到 kdbx */
    async btSaveKdbx(e: any) {
        let path: string = `db/${dbItem.path}/` + dbItem.dbPath
        $g.log('保存文件到 kdbx:' + path)
        const destPath: string = `db/${dbItem.path}/${dbItem.name}.kdbx.doc`
        if (await WXFile.copyFile(path, destPath)) {
            if (dbItem.tempFileList.indexOf(path) === -1) {
                dbItem.tempFileList.push(path);
                DBLibApi.storageSave($g.g.dbLib)
            }
            if (await WXFile.openDocument(destPath)) {

            } else {
                wx.showToast({ title: 'kdbx 格式被限制保存', icon: 'none', mask: false })
            }
        } else {
            wx.showToast({ title: '拷贝文件失败', icon: 'none', mask: false })
        }
    },
    async btSaveXML(e: any) {
        if (!this.inputPass()) {
            if (dbItem.db) {
                const db: Kdbx = dbItem.db
                const xml: string = await db.saveXml()
                let path: string = `db/${dbItem.path}/${dbItem.name}.xml.doc`
                if (await WXFile.writeFile(path, xml, 0, 'utf-8')) {
                    if (dbItem.tempFileList.indexOf(path) === -1) {
                        dbItem.tempFileList.push(path);
                        DBLibApi.storageSave($g.g.dbLib)
                    }
                    if (await WXFile.openDocument(path)) {

                    } else {
                        wx.showToast({ title: 'xml 格式被限制保存', icon: 'none', mask: false })
                    }
                    // $g.log('准备删除XML文件')
                    // WXFile.delFile(path)
                } else {
                    wx.showToast({ title: 'XML未保存成功', icon: 'none', mask: false })
                }
            }
        }
    },
    async btSaveTXT(e: any) {
        if (!this.inputPass()) {
            if (dbItem.db) {
                const db: Kdbx = dbItem.db
                const xml: string = await db.saveXml()
                let path: string = `db/${dbItem.path}/${dbItem.name}.txt.doc`
                if (await WXFile.writeFile(path, xml, 0, 'utf-8')) {
                    if (dbItem.tempFileList.indexOf(path) === -1) {
                        dbItem.tempFileList.push(path);
                        DBLibApi.storageSave($g.g.dbLib)
                    }
                    if (await WXFile.openDocument(path)) {

                    } else {
                        wx.showToast({ title: 'txt 格式被限制保存', icon: 'none', mask: false })
                    }
                    // $g.log('准备删除XML文件')
                    // WXFile.delFile(path)
                } else {
                    wx.showToast({ title: 'XML未保存成功', icon: 'none', mask: false })
                }
            }
        }
    },
    async btSaveCSV(e: any) {
        if (!this.inputPass()) {
            if (dbItem.db) {
                const db: Kdbx = dbItem.db
                const xml: string = await db.saveXml()
                let path: string = `db/${dbItem.path}/${dbItem.name}.csv.doc`
                if (await WXFile.writeFile(path, xml, 0, 'utf-8')) {
                    if (dbItem.tempFileList.indexOf(path) === -1) {
                        dbItem.tempFileList.push(path);
                        DBLibApi.storageSave($g.g.dbLib)
                    }
                    if (await WXFile.openDocument(path)) {

                    } else {
                        wx.showToast({ title: 'csv 格式被限制保存', icon: 'none', mask: false })
                    }
                    // $g.log('准备删除XML文件')
                    // WXFile.delFile(path)
                } else {
                    wx.showToast({ title: 'XML未保存成功', icon: 'none', mask: false })
                }
            }
        }
    },
    /** 这个可以成功, 但是格式需要重新整理 */
    async btSaveXLS(e: any) {
        if (!this.inputPass()) {
            if (dbItem.db) {
                const db: Kdbx = dbItem.db
                const xml: string = await db.saveXml()
                let path: string = `db/${dbItem.path}/${dbItem.name}.xls.doc`
                if (await WXFile.writeFile(path, xml, 0, 'utf-8')) {
                    if (dbItem.tempFileList.indexOf(path) === -1) {
                        dbItem.tempFileList.push(path);
                        DBLibApi.storageSave($g.g.dbLib)
                    }
                    if (await WXFile.openDocument(path)) {

                    } else {
                        wx.showToast({ title: '无法另存', icon: 'none', mask: false })
                    }
                    // $g.log('准备删除XML文件')
                    // WXFile.delFile(path)
                } else {
                    wx.showToast({ title: 'XML未保存成功', icon: 'none', mask: false })
                }
            }
        }
    },
    async btSaveMD(e: any) {
        if (!this.inputPass()) {
            if (dbItem.db) {
                const db: Kdbx = dbItem.db
                const md: string = await db.saveXml()
                let path: string = `db/${dbItem.path}/${dbItem.name}.md.doc`
                if (await WXFile.writeFile(path, md, 0, 'utf-8')) {
                    if (dbItem.tempFileList.indexOf(path) === -1) {
                        dbItem.tempFileList.push(path);
                        DBLibApi.storageSave($g.g.dbLib)
                    }
                    if (await WXFile.openDocument(path)) {

                    } else {
                        wx.showToast({ title: '无法另存', icon: 'none', mask: false })
                    }
                    // $g.log('准备删除XML文件')
                    // WXFile.delFile(path)
                } else {
                    wx.showToast({ title: 'XML未保存成功', icon: 'none', mask: false })
                }
            }
        }
    },
    async btClearTemp(e: any) {
        if (dbItem.tempFileList.length) {
            let l: number = dbItem.tempFileList.length
            while (--l > -1) {
                const path = dbItem.tempFileList[l]
                if (await WXFile.delFile(path)) {
                    DBLibApi.storageSave($g.g.dbLib)
                }
            }
        }
    },
    /** 恢复上一次保存的内容 */
    btRecovery(e: any) {
        const that = this
        wx.showModal({
            title: '是否切换',
            content: '是否切换到上一次保存成功的版本,切换后将无法恢复？',
            success: function (res) {
                if (res.confirm) {
                    that.btClose(null)
                    if (dbItem.pathMinIndex === 1) dbItem.pathMinIndex = 2
                    if (dbItem.pathMinIndex === 2) dbItem.pathMinIndex = 1
                    if (dbItem.pathMinIndex === 3) dbItem.pathMinIndex = 4
                    if (dbItem.pathMinIndex === 4) dbItem.pathMinIndex = 3
                    wx.showToast({ title: '成功', icon: 'success' })
                }
            }
        })
    },
    btCloudUpload(e: any) {
        // 如果是 base64 的就先不要上传了
        if ($g.g.systemInfo.brand === 'devtools') {
            wx.showModal({ title: '无法保存', content: '现阶段未开发二进制转换Base64功能' })
        } else {
            const dbPath: string = dbItem.dbPath
            $g.log('[WXCloudUpload]启动文件上传:', dbPath)
            if (dbPath) {
                if ($g.g.user.openid) {
                    wx.cloud.uploadFile({
                        cloudPath: `user/${$g.g.user.openid}/db/${dbItem.path}/db.min.kdbx`, // 上传至云端的路径 user/openid/path/....
                        filePath: `${wx.env.USER_DATA_PATH}/db/${dbItem.path}/${dbPath}`, // 小程序临时文件路径
                        success: res => {
                            $g.log('[WXCloudUpload]成功', res)
                            wx.showToast({ title: '成功', icon: 'success' })
                            dbItem.cloudWX.upload = true
                            dbItem.cloudWX.timeUpload = new Date()
                            DBLibApi.storageSave($g.g.dbLib)
                        },
                        fail: e => {
                            $g.log('[WXCloudUpload]错误', e)
                        }
                    })
                } else {
                    wx.showModal({ title: '无法使用', content: '使用云服务, 需要先登录!' })
                }
            } else {
                wx.showModal({ title: '本地文件缺失', content: '未找到可以上传的文件' })
            }
        }
    },
    btCloudDownload(e: any) {
        const that = this
        if ($g.g.user.openid) {
            wx.showModal({
                title: '替换本地',
                content: '是否将云平台档案替换到本地? 完成后如要还原请用"恢复本地上次保存"来还原(只能还原上次,一次机会)!',
                success: function (res) {
                    if (res.confirm) {
                        $g.log('[WXCloudDownload]下载云备份')
                        wx.cloud.downloadFile({
                            fileID: `${$g.g.app.urlCloudWX}/user/${$g.g.user.openid}/db/${dbItem.path}/db.min.kdbx`, // 云端的路径
                            success: async res => {
                                $g.log('[WXCloudDownload]成功', res)
                                let savePath: string = `db/${dbItem.path}/`
                                let pathMinIndex: number = 0
                                if ($g.g.systemInfo.brand === 'devtools') {
                                    // 如果是开发者工具, 存Base64, 因为二进制不稳定
                                    savePath += 'db.kdbx'
                                    pathMinIndex = 0
                                } else {
                                    if (dbItem.pathMinIndex === 1) {
                                        savePath += 'db.min.2.kdbx'
                                        pathMinIndex = 2
                                    } else {
                                        savePath += 'db.min.1.kdbx'
                                        pathMinIndex = 1
                                    }
                                }
                                if (await WXFile.saveFile(res.tempFilePath, savePath)) {
                                    dbItem.pathMinIndex = pathMinIndex
                                    that.btClose(null)
                                    wx.showToast({ title: '成功', icon: 'success' })
                                    dbItem.cloudWX.timeDownload = new Date()
                                    DBLibApi.storageSave($g.g.dbLib)
                                } else {
                                    wx.showModal({ title: '还原失败', content: '下载的还原文件未成功保存, 请使用"恢复本地上次保存"还原上版信息' })
                                }
                            },
                            fail: e => {
                                $g.log('[WXCloudDownload]错误', e)
                                wx.showModal({ title: '还原失败', content: e.errMsg })
                            }
                        })
                    }
                }
            })
        } else {
            wx.showModal({ title: '无法使用', content: '使用云服务, 需要先登录!' })
        }
    },
    btCloudDel(e: any) {
        const dbPath: string = dbItem.dbPath
        $g.log('[WXCloudDownload]启动文件下载 New ', dbPath)
        if (dbPath) {
            let path: string = `db/${dbItem.path}/${dbPath}`
            wx.cloud.deleteFile({
                fileList: [path], // 上传至云端的路径
                success: res => {
                    $g.log('[WXCloudDel]成功', res)
                },
                fail: e => {
                    $g.log('[WXCloudDel]错误', e)
                }
            })
        }
    },
})
