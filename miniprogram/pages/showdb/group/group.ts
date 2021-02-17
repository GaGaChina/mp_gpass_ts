import { $g } from "../../../frame/speed.do"
import { TimeFormat } from "../../../frame/time/time.format"
import { DBItem, DBLib } from "../../../lib/g-data-lib/db"
import { KdbxApi } from "../../../lib/g-data-lib/kdbx.api"
import { Group, Kdbx } from "../../../lib/kdbxweb/types"

/** 整个库 */
var dbLib: DBLib;
/** 默认选中的库 */
var dbItem: DBItem;
/** 默认选中的库的Kdbx */
var db: Kdbx;
/** 现在在操作的 entry */
var group: Group;

/**
 * 列表
 * KdbxGroup
 * name 文件夹名称
 * notes 文件夹的备注
 * icon 文件夹的ICON
 */
Page({
    data: {
        fullPageHeight: 0,
        /** add:添加条目, edit:编辑条目, show:展示条目, history:展示历史(无法修改) */
        pagetype: '',
        /** 台头显示的标题 */
        pagetitle: '',
        /** 本页添加的模板 */
        infotype: '',
        /** 本页展示的UUID对象 */
        uuid: '',
        icon: 0,
        title: '',
        /** 条目的创建时间 */
        timeCreat: '',
        /** 上一次访问的时间 */
        timeLastAccess: '',
        /** 上一次修改的时间 */
        timeLastMod: '',
    },
    onLoad(query: any) {
        const scene: DataScene = $g.g.app.scene
        const fullHeight: number = scene.winHeight - scene.topBarHeight - scene.topBarTop
        this.setData({
            fullPageHeight: fullHeight,
        })
        $g.log('onLoad GET : ', query);
        if ($g.hasKey(query, 'uuid')) {
            this.data.uuid = String(query.uuid)
            let length = this.data.uuid.length % 4
            if (length > 0) {
                while (++length < 5) {
                    this.data.uuid += '='
                }
            }
        }
        // 获取是否是添加新条目
        if ($g.hasKey(query, 'type')) {
            const type: string = String(query.type)
            let title: string = ''
            if (type === 'add') {
                title = '添加新文件夹'
            } else if (type === 'show') {
                title = '文件夹详情'
            } else if (type === 'edit') {
                title = '文件夹编辑'
            } else if (type === 'history') {
                title = '文件夹展示历史(无法修改)'
            }
            this.setData({
                pagetype: type,
                pagetitle: title
            })
        }
        // 获取条目的模板样式
        if ($g.hasKey(query, 'infotype')) {
            this.data.infotype = String(query.type)
        }
        // 设置默认的
        dbLib = $g.g.dbLib
        const select: any = dbLib.selectItem
        if (select) {
            dbItem = select
            if (dbItem.db) db = dbItem.db
        }
        // 没有设置会返回
        if (!db) wx.navigateBack()
    },
    onShow() {
        $g.step.clear()
        // 如果时间超过了, 就切换回其他的页面
        if ($g.g.app.timeMouse + $g.g.app.timeMouseClose < Date.now()) {
            $g.log('[index]超时,退回登录页:', Date.now() - $g.g.app.timeMouse)
            if (dbItem && dbItem.db) dbItem.db = null
            wx.reLaunch({ url: './../../index/index' })
            return
        }
        switch (this.data.pagetype) {
            case 'show':
                const findGroup: any = KdbxApi.findUUID(db.groups[0], this.data.uuid)
                if (findGroup && $g.isClass(findGroup, 'KdbxGroup')) {
                    group = findGroup
                    group.times.lastAccessTime = new Date()
                    dbItem.selectGroup = group
                    this.setInfo()
                } else {
                    wx.navigateBack()
                }
                break;
            case 'add':
                if (dbItem.selectGroup) {
                    group = db.createGroup(dbItem.selectGroup, '新建组')
                    dbItem.addGroup = group
                    dbItem.selectGroup = group
                    this.setInfo()
                } else {
                    $g.log('缺少选中组')
                }
                break;
            default:
                $g.log('未找到类型 : ' + this.data.pagetype)
        }
    },
    onUnload() {
        $g.log('[page][group]清理')
        var theNull: any = null
        dbLib = theNull
        if (dbItem) {
            // dbItem.selectGroup = null
            // dbItem.selectEntry = null
            dbItem = theNull
        }
        db = theNull
    },
    setInfo() {
        $g.log('解析条目 : ', group)
        // --------------------------设置标题
        let title: string = ''
        if ($g.isClass(group.name, 'ProtectedValue')) {
            title = '******'
        } else {
            title = String(group.name)
        }
        this.setData({
            icon: group.icon,
            title: title,
            timeCreat: TimeFormat.showLang(group.times.creationTime),
            timeLastAccess: TimeFormat.showLang(group.times.lastAccessTime),
            timeLastMod: TimeFormat.showLang(group.times.lastModTime),
        })
    },
    btBack(e: any) {
        $g.g.app.timeMouse = Date.now()
        if (dbItem.addGroup) {
            db.remove(dbItem.addGroup)
            dbItem.addGroup = null
        }
        wx.navigateBack();
    },
    /** 从编辑模式切换回展示 */
    btBackShow(e: any) {
        $g.g.app.timeMouse = Date.now()
        this.setInfo()
        this.setData({ pagetype: 'show' })
    },
    /** 鉴定是否全合法 */
    checkGroup(): boolean {
        let haveCheck: boolean = false
        if (this.data.title.length === 0) {
            haveCheck = true
        }
        return !haveCheck
    },
    /** 按钮 : 保存修改 */
    async btSave(e: any) {
        $g.g.app.timeMouse = Date.now()
        $g.log('[group][Save]', this.data.title)
        if (!this.checkGroup()) {
            wx.showToast({ title: '请添加标题', icon: 'none', mask: false })
            return
        }
        if (dbItem.addGroup) dbItem.addGroup = null
        group.times.update()
        group.icon = this.data.icon
        group.name = this.data.title
        await dbItem.saveFileAddStorage()
        await $g.step.clear()
        dbItem.infoRefresh = true
        this.setData({ pagetype: 'show' })
    },
    btEdit(e: any) {
        $g.g.app.timeMouse = Date.now()
        this.setData({ pagetype: 'edit' })
    },
    /** 组件, 当台头输入框有变化的时候回调 */
    titleChange(e: any) {
        const info: any = e.detail
        this.setData({
            icon: info.icon,
            title: info.title
        })
    },
    /** 按钮 : 删除 组 */
    btDel(e: any) {
        $g.g.app.timeMouse = Date.now()
        const that = this
        wx.showModal({
            title: '提示',
            content: '你确定删除本条记录吗!',
            async success(e) {
                //开始设置
                await that.delGroup()
            }
        })
    },
    /** 删除现在的这个对象 */
    async delGroup() {
        if (db && group) {
            let recycleUUID: string = ''
            let groupUUID: string = ''
            if (group.uuid && group.uuid.id) groupUUID = group.uuid.id
            const meta: any = db.meta
            if (meta && meta.recycleBinUuid) recycleUUID = meta.recycleBinUuid.id
            if (recycleUUID && group.parentGroup && group.parentGroup.uuid && group.parentGroup.uuid.id === recycleUUID) {
                const _db: any = db
                _db.move(group, null)
            } else {
                db.remove(group)
            }
            if (groupUUID && dbItem.selectGroup && dbItem.selectGroup.uuid && dbItem.selectGroup.uuid.id === groupUUID) {
                dbItem.selectGroup = null
            }
            await dbItem.saveFileAddStorage()
            await $g.step.clear()
            dbItem.infoRefresh = true
            wx.navigateBack();
        }
    },
})
