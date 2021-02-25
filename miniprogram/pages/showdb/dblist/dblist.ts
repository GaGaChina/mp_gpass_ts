import { $g } from "../../../frame/speed.do"
import { TimeFormat } from "../../../frame/time/time.format"
import { WXFile } from "../../../frame/wx/wx.file"
import { GFileSize } from "../../../lib/g-byte-file/g.file.size"
import { DBItem, DBLib } from "../../../lib/g-data-lib/db"

Page({
    data: {
        fullPageHeight: 0,
        centerPageHeight: 0,
        selectIndex: 0,
        dbList: new Array<Object>(),
        /** 现在文件总大小 */
        fileSizeAll: '',
        /** 可以存放的文件总大小 */
        fileSizeMax: '',
        /** 富裕空间大小 */
        fileSizeMore: '',
        /** 本地可用空间大小 */
        fileSizeUsable: ''
    },
    async onLoad() {
        // $g.log('[Page][dblist]onLoad')
        const scene: DataScene = $g.g.app.scene
        const fullHeight: number = scene.winHeight - scene.topBarHeight - scene.topBarTop
        const centerHeight: number = fullHeight - 240
        this.setData({
            fullPageHeight: fullHeight,
            centerPageHeight: centerHeight,
        })
    },
    onShow() {
        // $g.log('[Page][dblist]onShow')
        this.loadInfo()
    },
    async loadInfo() {
        const dbLib: DBLib = $g.g.dbLib
        // await dbLib.fileSizeRun()
        const dbList: Array<Object> = new Array<Object>();
        dbLib.fileSizeAll = 0
        for (let i = 0, l: number = dbLib.lib.length; i < l; i++) {
            const item: DBItem = dbLib.lib[i]
            if (item.path) {
                await item.fileClear()
                const newSize: number = await WXFile.getFileSize(`db/${item.path}`, true)
                item.fileSizeAll = newSize
                dbLib.fileSizeAll += newSize
            }
            await item.fileSize()
            const dbItem: Object = {
                icon: item.icon,
                name: item.name,
                id: item.localId,
                isOpen: item.db ? true : false,
                timeCreat: TimeFormat.showLang(item.timeCreat),
                timeRead: TimeFormat.showLang(item.timeRead),
                timeChange: TimeFormat.showLang(item.timeChange),
                fileSize: GFileSize.getSize(item.fileSizeAll, 3),
                isSelect: item.localId === dbLib.selectId
            }
            dbList.push(dbItem)
        }
        this.setData({
            dbList: dbList,
            selectIndex: dbLib.selectId,
            fileSizeAll: GFileSize.getSize(dbLib.fileSizeAll, 3),
            fileSizeMax: GFileSize.getSize(dbLib.fileSizeMax, 3),
            fileSizeMore: GFileSize.getSize(1024 * 1024 * 10, 3),
            fileSizeUsable: GFileSize.getSize(dbLib.fileSizeMax - dbLib.fileSizeAll - (1024 * 1024 * 10), 3),
        })
        dbLib.storageSaveThis()
        $g.log('[Page/dblist]', this.data)
    },
    /** 添加一条记录 */
    btCreat(e: any) {
        wx.reLaunch({
            url: './../../index/index?isCreat=1'
        })
    },
    /** 打开某一个库 */
    btOpen(e: any) {
        const dbLib: DBLib = $g.g.dbLib
        dbLib.selectId = Number(e.currentTarget.dataset.id)
        dbLib.storageSaveThis()
        wx.reLaunch({
            url: './../../index/index?isCreat=0'
        })
    },
    /** 关闭现在打开的库 */
    btClose(e: any) {
        const dbLib: DBLib = $g.g.dbLib
        const id: number = Number(e.currentTarget.dataset.id)
        const dbItem: DBItem | null = dbLib.selectLocalId(id)
        if (dbItem) {
            dbItem.db = null
            WXFile.rmDir('temp', true)
            this.loadInfo()
        }
    },
    btEdit(e: any) {
        wx.navigateTo({ url: './../dbedit/dbedit?id=' + e.currentTarget.dataset.id })
    }
})
