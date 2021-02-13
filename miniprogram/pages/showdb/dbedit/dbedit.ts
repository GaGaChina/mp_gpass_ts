import { $g } from "../../../frame/speed.do"
import { GFileSize } from "../../../lib/g-byte-file/g.file.size"
import { DBItem, DBLib } from "../../../lib/g-data-lib/db"
import { Kdbx } from "../../../lib/kdbxweb/types"
import { WXSoterAuth } from "./../../../frame/wx/wx.soter.auth"
import { WXFile } from "./../../../frame/wx/wx.file"
import { AES } from "../../../frame/crypto/AES"
import { KdbxApi } from "../../../lib/g-data-lib/kdbx.api"
import { TimeFormat } from "../../../frame/time/time.format"

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
        isOpen: false,
    },
    onLoad(query: any) {
        // 获取尺寸
        const scene: DataScene = $g.g.app.scene
        const fullHeight: number = scene.winHeight - scene.topBarHeight - scene.topBarTop
        this.setData({ fullPageHeight: fullHeight })
        // 开始设置
        const dbLib: DBLib = $g.g.dbLib
        let item: DBItem | null = dbLib.selectItem
        $g.log('onLoad GET : ', query);
        if ($g.hasKey(query, 'id')) {
            const queryId: number = Number(query.id)
            if (item === null || item.localId !== queryId) {
                let itemQuery: DBItem | null = dbLib.selectLocalId(queryId)
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
                wx.reLaunch({ url: './../../index/index' })
            }
        }
    },
    async loadItem(item: DBItem | null): Promise<any> {
        await WXSoterAuth.checkSupport();
        if (item) {
            $g.log('设置参数')
            dbItem = item
            const fileSizeNum: number = await dbItem.fileSize()
            const fileSize: string = GFileSize.getSize(fileSizeNum, 3)
            this.setData({
                dbLocalId: dbItem.localId,
                icon: dbItem.icon,
                name: dbItem.name,
                path: dbItem.path,
                isOpen: dbItem.db ? true : false,
                timeCreat: TimeFormat.showLang(dbItem.timeCreat),
                timeRead: TimeFormat.showLang(dbItem.timeRead),
                timeChange: TimeFormat.showLang(dbItem.timeChange),
                fileSize: fileSize,
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
            dbLib.storageSaveThis()
        }
        wx.reLaunch({
            url: './../../index/index?isCreat=0'
        })
    },
    /** 关闭现在打开的库 */
    btClose(e: any) {
        if (dbItem) {
            dbItem.db = null
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
                await dbItem.rmDir()
                const dbLib: DBLib = $g.g.dbLib
                if (await dbLib.remove(that.data.dbLocalId) === false) {
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
    async btChnagePass(e: any) {
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
                    await AES.setKey(key)
                    let pass: string = dbItem.pass.pv.getText()
                    let passJM: ArrayBuffer | null = await AES.encryptCBC(pass, o)
                    if (passJM) {
                        dbItem.pass.facial = KdbxApi.kdbxweb.ByteUtils.bytesToBase64(passJM)
                        if (WXSoterAuth.fingerPrint === false || dbItem.pass.fingerPrint !== '') {
                            dbItem.pass.pv = null
                        }
                        const dbLib: DBLib = $g.g.dbLib
                        dbLib.storageSaveThis()
                        this.setData({ isFacial: true })
                    } else {
                        wx.showToast({ title: '加密失败!', icon: 'none', mask: false })
                    }
                }
                o = ''
                await AES.setKey('')
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
                    await AES.setKey(key)
                    let pass: string = dbItem.pass.pv.getText()
                    let passJM: ArrayBuffer | null = await AES.encryptCBC(pass, o)
                    if (passJM) {
                        dbItem.pass.fingerPrint = KdbxApi.kdbxweb.ByteUtils.bytesToBase64(passJM)
                        if (WXSoterAuth.facial === false || dbItem.pass.facial !== '') {
                            dbItem.pass.pv = null
                        }
                        const dbLib: DBLib = $g.g.dbLib
                        dbLib.storageSaveThis()
                        this.setData({ isFingerPrint: true })
                    } else {
                        wx.showToast({ title: '加密失败!', icon: 'none', mask: false })
                    }
                }
                o = ''
                await AES.setKey('')
            } else {
                wx.showToast({ title: '需要输入密码才能进行设置!', icon: 'none', mask: false })
            }
        }
    },
    /** 保存文件到 kdbx */
    async btSaveKdbx(e: any) {
        let path: string = `db/${dbItem.path}/` + dbItem.getFilePath()
        $g.log('保存文件到 kdbx:' + path)
        const destPath: string = `db/${dbItem.path}/${dbItem.name}.kdbx.doc`
        if (await WXFile.copyFile(path, destPath)) {
            if (dbItem.tempFileList.indexOf(path) === -1) {
                dbItem.tempFileList.push(path);
                ($g.g.dbLib as DBLib).storageSaveThis()
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
                        ($g.g.dbLib as DBLib).storageSaveThis()
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
                        ($g.g.dbLib as DBLib).storageSaveThis()
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
                        ($g.g.dbLib as DBLib).storageSaveThis()
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
                        ($g.g.dbLib as DBLib).storageSaveThis()
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
                        ($g.g.dbLib as DBLib).storageSaveThis()
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
                    ($g.g.dbLib as DBLib).storageSaveThis()
                }
            }
        }
    }
})
