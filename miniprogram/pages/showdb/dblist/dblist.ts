import { $g } from "../../../frame/speed.do"
import { TimeFormat } from "../../../frame/time/time.format"
import { WXFile } from "../../../frame/wx/wx.file"
import { GFileSize } from "../../../lib/g-byte-file/g.file.size"
import { DBItem, DBLib } from "../../../lib/g-data-lib/db"
import { DBLibApi } from "../../../lib/g-data-lib/db.lib.api"

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
        await DBLibApi.countFileSize(dbLib)
        $g.g.app.DEBUG && $g.log(dbLib)
        const dbList: Array<Object> = new Array<Object>();
        for (let i = 0, l: number = dbLib.lib.length; i < l; i++) {
            const item: DBItem = dbLib.lib[i]
            const dbItem: Object = {
                icon: item.icon,
                name: item.name,
                id: item.localId,
                isOpen: item.db ? true : false,
                timeCreat: TimeFormat.showLang(item.count.timeCreat),
                timeRead: TimeFormat.showLang(item.count.timeRead),
                timeChange: TimeFormat.showLang(item.count.timeChange),
                fileSize: GFileSize.getSize(item.count.sizeFolder, 3),
                isSelect: item.localId === dbLib.selectId
            }
            dbList.push(dbItem)
        }
        const maxSize: number = 1024 * 1024 * 200
        const minSize: number = 1024 * 1024 * 10
        this.setData({
            dbList: dbList,
            selectIndex: dbLib.selectId,
            fileSizeAll: GFileSize.getSize(dbLib.count.sizeFolder, 3),
            fileSizeMax: GFileSize.getSize(maxSize, 3),
            fileSizeMore: GFileSize.getSize(minSize, 3),
            fileSizeUsable: GFileSize.getSize(maxSize - dbLib.count.sizeFolder - minSize, 3),
        })
        DBLibApi.storageSave(dbLib)
        $g.g.app.DEBUG && $g.log('[Page/dblist]', this.data)
    },
    /** 添加一条记录 */
    btCreat(e: any) {
        wx.reLaunch({
            url: './../../index/index?isCreat=1'
        })
    },
    /** 打开某一个库 */
    async btOpen(e: any) {
        const dbLib: DBLib = $g.g.dbLib
        const dbItem: DBItem | null = dbLib.selectItem
        if (dbItem) {
            dbItem.db = null
            await WXFile.rmDir('temp', true)
            this.loadInfo()
        }
        dbLib.selectId = Number(e.currentTarget.dataset.id)
        DBLibApi.storageSave(dbLib)
        wx.reLaunch({
            url: './../../index/index?isCreat=0'
        })
    },
    /** 关闭现在打开的库 */
    async btClose(e: any) {
        const dbLib: DBLib = $g.g.dbLib
        const id: number = Number(e.currentTarget.dataset.id)
        const dbItem: DBItem | null = DBLibApi.getItem(dbLib, id)
        if (dbItem) {
            dbItem.db = null
            await WXFile.rmDir('temp', true)
            this.loadInfo()
        }
    },
    btEdit(e: any) {
        wx.navigateTo({ url: './../dbedit/dbedit?id=' + e.currentTarget.dataset.id })
    }
})
