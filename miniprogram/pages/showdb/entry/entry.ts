import { $g } from "../../../frame/speed.do"
import { TimeFormat } from "../../../frame/time/time.format"
import { WXFile } from "../../../frame/wx/wx.file"
import { DBItem, DBLib } from "../../../lib/g-data-lib/db"
import { DBItemApi } from "../../../lib/g-data-lib/db.item.api"
import { KdbxApi } from "../../../lib/g-data-lib/kdbx.api"
import { Entry, Group, Kdbx } from "../../../lib/kdbxweb/types"

/** 整个库 */
var dbLib: DBLib;
/** 默认选中的库 */
var dbItem: DBItem;
/** 默认选中的库的Kdbx */
var db: Kdbx;
/** 现在在操作的 entry */
var entry: Entry;
/** 现在操作的entry内的GKeyValue */
var gkv: any;

/**
 * 列表
 * 
 * KdbxGroup
 * name 文件夹名称
 * notes 文件夹的备注
 * icon 文件夹的ICON
 * 
 * 每个单元有起始 x 和 height (为拖拉交换位置做准备)
 * 
 * Entry 每条的详细记录
 * bgColor 背景色
 * fgColor 前景色
 * icon 图标
 * overrideUrl 替代网址（例如使用指定的浏览器）好像是win调用浏览器打开网址
 * history Array<Entry>
 * binaries 二进制文件, key(文件名):{ref:'', value:ArrayBuffer}
 * fields 的key值
 *     Title 标题
 *     UserName 用户名
 *     Password 密码 ProtectedValue
 *     URL 连接
 *     Notes 备注
 *     自定义字段 : 值
 *     ----------特殊记录----------, 文件放 uuid文件夹下, 名字用 tb6e2mKXlUWhRAGMwPFiLw==
 *     template:模板id 标题替换(Title -> 银行卡号), 字段, type类型, 
 *     GKeyValue : icon:{Password:1, URL:2, Notes:3}, file:[{name:'', ref:''}]
 * 
 * 组件, key, value/密码形态, icon, type字段类型, index (返回y和height)
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
        /** 展示的历史索引 */
        historyIndex: 0,
        icon: 0,
        title: '',
        /** 条目的创建时间 */
        timeCreat: '',
        /** 上一次访问的时间 */
        timeLastAccess: '',
        /** 上一次修改的时间 */
        timeLastMod: '',
        /** icon图标名称, title标题, display详情, ispv值是否是pv */
        defaultList: new Array<Object>(),
        otherList: new Array<Object>(),
        /** name文件名(去扩展名), nameall全名, icon显示图标, type文件扩展名, ref, isbyte是否是二进制, path不是二进制的时候路径, size文件大小 */
        fileList: new Array<Object>(),
        /** 历史记录 */
        historyList: new Array<Object>(),
    },
    onLoad(query: any) {
        const scene: DataScene = $g.g.app.scene
        const fullHeight: number = scene.winHeight - scene.topBarHeight - scene.topBarTop
        this.setData({ fullPageHeight: fullHeight })
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
                title = '添加新条目'
            } else if (type === 'show') {
                title = '条目展示'
            } else if (type === 'edit') {
                title = '条目编辑'
            } else if (type === 'history') {
                title = '展示历史(无法修改)'
            }
            this.setData({
                pagetype: type,
                pagetitle: title
            })
        }
        // 历史索引的位置
        if ($g.hasKey(query, 'history')) {
            this.setData({ historyIndex: Number(query.history) })
        }
        // 获取条目的模板样式 normal bank web certificate
        if ($g.hasKey(query, 'infotype')) {
            this.data.infotype = String(query.type)
        }
        // 设置默认的
        dbLib = $g.g.dbLib
        const select: DBItem | null = dbLib.selectItem
        if (select) {
            dbItem = select
            if (dbItem.db) db = dbItem.db
        }
        this.reLoadInfo()
    },
    onShow() {
        $g.step.clear()
        // 如果时间超过了, 就切换回其他的页面
        if ($g.g.app.timeMouse + $g.g.app.timeMouseClose < Date.now() || dbItem === null || dbItem.db === null) {
            $g.log('[index]超时,退回登录页:', Date.now() - $g.g.app.timeMouse)
            if (dbItem && dbItem.db) {
                dbItem.db = null
                WXFile.rmDir('temp', true)
            }
            wx.reLaunch({ url: './../../index/index' })
        }
    },
    reLoadInfo() {
        // 没有设置会返回
        if (db) {
            switch (this.data.pagetype) {
                case 'show':
                    const findEntry: any = KdbxApi.findUUID(db.groups[0], this.data.uuid)
                    if (findEntry && $g.isClass(findEntry, 'KdbxEntry')) {
                        entry = findEntry
                        entry.times.lastAccessTime = new Date()
                        dbItem.selectEntry = entry
                        this.setInfo()
                    } else {
                        wx.navigateBack()
                    }
                    break;
                case 'add':
                    if (dbItem.selectGroup === null) {
                        const groups: Group[] = db.groups
                        dbItem.selectGroup = groups[0]
                    }
                    entry = db.createEntry(dbItem.selectGroup)
                    dbItem.addEntry = entry
                    dbItem.count.entry++
                    dbItem.selectEntry = entry
                    this.setInfo()
                    break;
                case 'history':
                    const historyEntry: any = KdbxApi.findUUID(db.groups[0], this.data.uuid)
                    if (historyEntry && $g.isClass(historyEntry, 'KdbxEntry')) {
                        if (historyEntry.history.length > this.data.historyIndex) {
                            entry = historyEntry.history[this.data.historyIndex]
                            dbItem.selectEntry = entry
                            this.setInfo()
                        } else {
                            wx.navigateBack()
                        }
                    } else {
                        wx.navigateBack()
                    }
                    break;
                default:
                    $g.log('[entry]未找到类型 : ' + this.data.pagetype)
            }
        } else {
            wx.navigateBack()
        }
    },
    onUnload() {
        $g.log('[page][entry]清理')
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
        $g.log('解析条目 : ', entry)
        // --------------------------设置标题
        let title: string = ''
        if ($g.isClass(entry.fields?.Title, 'ProtectedValue')) {
            title = '******'
        } else {
            title = String(entry.fields?.Title)
        }
        // --------------------------特殊意义对象
        if ($g.hasKey(entry.fields, 'GKeyValue')) {
            const gkvJSON: any = entry.fields['GKeyValue']
            gkv = JSON.parse(gkvJSON)
        } else {
            gkv = {}
        }
        // --------------------------其他字段为特殊字段
        const defaultList: Array<Object> = new Array<Object>()
        const firstKey: Array<string> = ['UserName', 'Password', 'URL', 'Notes']
        for (let i = 0; i < firstKey.length; i++) {
            defaultList.push(this.getFieldKey(firstKey[i], defaultList.length, true, false, false, false, false))
        }
        // --------------------------添加其他的字段
        const otherList: Array<Object> = new Array<Object>()
        const otherKey: Array<string> = Object.keys(entry.fields)
        if ($g.hasKey(gkv, 'keystep')) {
            // 按顺序先排有循序的
            const keystep: Array<string> = gkv['keystep']
            for (let i = 0; i < keystep.length; i++) {
                const key = keystep[i]
                const keyindex: number = otherKey.indexOf(key)
                if (keyindex !== -1) {
                    otherKey.splice(keyindex, 1)
                    otherList.push(this.getFieldKey(key, otherList.length, true, true, true, true, true))
                }
            }
        }
        // 添加剩余没有循序的
        for (let i = 0; i < otherKey.length; i++) {
            const key = otherKey[i]
            if (key !== 'GKeyValue' && key !== 'Title' && firstKey.indexOf(key) === -1) {
                otherList.push(this.getFieldKey(key, otherList.length, true, true, true, true, true))
            }
        }
        // --------------------------添加附件
        const fileList: Array<Object> = new Array<Object>()
        // --------------------------添加 GKeyValue 的文件
        if ($g.hasKey(gkv, 'filelist')) {
            const gkvFileList: [] = gkv['filelist']
            for (let i = 0; i < gkvFileList.length; i++) {
                const gkvFileItem: any = gkvFileList[i];
                const fileItem: object = {
                    index: i,
                    name: gkvFileItem.name,// 文件添加的时候的名称
                    ref: gkvFileItem.ref,// 整个路径 uuid + '.' + ref
                    pass: gkvFileItem.pass,// AES 加密的密码
                    size: gkvFileItem.size,// 解压后的长度
                    savetype: gkvFileItem.savetype,// base64
                }
                fileList.push(fileItem)
            }
        }
        // --------------------------添加历史记录
        const historyList: Array<Object> = new Array<Object>()
        if (entry.history.length) {
            for (let i = 0; i < entry.history.length; i++) {
                const item: Entry = entry.history[i]
                const historyItem: object = {
                    title: TimeFormat.showLang(item.times.lastModTime),
                }
                historyList.push(historyItem)
            }
        }
        this.setData({
            icon: entry.icon,
            title: title,
            timeCreat: TimeFormat.showLang(entry.times.creationTime),
            timeLastAccess: TimeFormat.showLang(entry.times.lastAccessTime),
            timeLastMod: TimeFormat.showLang(entry.times.lastModTime),
            defaultList: defaultList,
            otherList: otherList,
            fileList: fileList,
            historyList: historyList,
        })
    },
    defaultListChange(e: any): void {
        this.data.defaultList = e.detail
    },
    otherListChange(e: any): void {
        this.data.otherList = e.detail
    },
    fileListChange(e: any): void {
        this.data.fileList = e.detail
    },
    /**
     * 添加一些默认值
     * @param key 键值
     * @param index 在父数组中的索引
     * @param changeicon 是否可以修改icon图标 
     * @param changetype 是否可以修改值的类型
     * @param changekey 是否可以修改键名
     * @param candel 是否可以删除这一条
     */
    getFieldKey(key: string, index: number, changeicon: boolean = true, changetype: boolean = true, changekey: boolean = true, candel: boolean = true, canmove: boolean = true): Object {
        let keyname: string = key
        let value: string = ''
        let valuetype: string = 'string'
        let icon: string = ''
        switch (key) {
            case 'UserName':
                keyname = '用户名'
                icon = 'user'
                break;
            case 'Password':
                keyname = '密　码'
                icon = 'key'
                break;
            case 'Notes':
                keyname = '备　注'
                icon = 'book'
                valuetype = 'txt'
                break;
            case 'URL':
                keyname = '网　址'
                icon = 'globe'
                break
        }
        if (entry.fields && $g.hasKey(entry.fields, key)) {
            const item: any = entry.fields[key]
            if ($g.isClass(item, 'ProtectedValue')) {
                valuetype = 'pv'
                // value = '******'
                value = item.getText()
            } else {
                value = item
            }
        }
        // 从 gkv 中取出 icon的设置
        if ($g.hasKey(gkv, 'icon') && $g.hasKey(gkv.icon, key)) {
            icon = gkv.icon[key]
        }
        let out: Object = {
            index: index,
            icon: icon,
            key: key,
            keyname: keyname,
            keydiff: true,
            value: value,
            valuetype: valuetype,
            changeicon: changeicon,
            changetype: changetype,
            changekey: changekey,
            candel: candel,
            canmove: canmove,
        }
        return out
    },
    /** 添加一个新的字段 */
    btAddField() {
        $g.g.app.timeMouse = Date.now()
        let out: Object = {
            index: this.data.otherList.length,
            icon: 'key',
            key: '自定义字段' + this.data.otherList.length,
            keyname: '自定义字段' + this.data.otherList.length,
            keydiff: false,
            value: '',
            valuetype: 'string',
            changeicon: true,
            changetype: true,
            changekey: true,
            candel: true,
            canmove: true,
        }
        this.data.otherList.push(out)
        this.setData({ otherList: this.data.otherList })
    },
    btBack(e: any) {
        $g.g.app.timeMouse = Date.now()
        if (dbItem.addEntry) {
            db.remove(dbItem.addEntry)
            dbItem.addEntry = null
            dbItem.count.entry--
        }
        wx.navigateBack();
    },
    /** 从编辑模式切换回展示 */
    btBackShow(e: any) {
        $g.g.app.timeMouse = Date.now()
        this.setInfo()
        this.setData({ pagetype: 'show' })
    },
    /** 清理掉 otherList 中空白的选项 */
    clearOtherNull(): void {
        let length: number = this.data.otherList.length
        while (--length > -1) {
            const info: any = this.data.otherList[length]
            if (info.key === '' && info.value === '') {
                this.data.otherList.splice(length, 1)
            }
        }
    },
    /** 鉴定 otherList 中的值是否全合法, false 未检测通过 */
    checkOther(): boolean {
        const firstKey: Array<string> = ['title', 'username', 'password', 'url', 'notes']
        // --------- 查找重命名的
        let keyName: Array<string> = new Array<string>()
        for (let i = 0; i < this.data.otherList.length; i++) {
            const info: any = this.data.otherList[i]
            const key: string = info.key.toLocaleLowerCase()
            if (key === '') {
                return false
            } else if (firstKey.indexOf(key) !== -1) {
                return false
            } else {
                let keyIndex: number = keyName.indexOf(key)
                if (keyIndex === -1) {
                    keyName.push(key)
                } else {
                    return false
                }
            }
        }
        return true
    },
    /** 查看文件有没有重复的值, false 未检测通过 */
    checkFile(): boolean {
        // --------- 查找重命名的
        let NameList: Array<string> = new Array<string>()
        for (let i = 0; i < this.data.fileList.length; i++) {
            const info: any = this.data.fileList[i]
            const key: string = info.name.toLocaleLowerCase()
            if (key === '') {
                return false
            } else {
                let nameIndex: number = NameList.indexOf(key)
                if (nameIndex === -1) {
                    NameList.push(key)
                } else {
                    return false
                }
            }
        }
        return true
    },
    async btSave(e: any) {
        $g.g.app.timeMouse = Date.now()
        $g.log('[entry.Save]', this.data.title)
        this.clearOtherNull()
        // 前5个只允许出现在 defaultList , 并检查 otherList 不允许重名
        // 判断 key 值是否全部合法
        if (!this.checkOther()) {
            wx.showModal({ title: '标签错误', content: '请修复不合法的自定义标签名称', showCancel: false })
            return
        }
        if (!this.checkFile()) {
            wx.showModal({ title: '文件名错误', content: '请修复不合法的文件名', showCancel: false })
            return
        }
        // 通过判断测试..........
        if (dbItem.addEntry) {
            dbItem.addEntry = null
        } else {
            entry.pushHistory()
            // 最多5条, 否则很乱
            if (entry.history.length > 3) {
                entry.removeHistory(0, entry.history.length - 3)
            }
        }
        entry.times.update()
        entry.icon = this.data.icon
        entry.fields.Title = this.data.title
        // 清理老的记录
        const delKey: Array<string> = Object.keys(entry.fields)
        const firstKey: Array<string> = ['Title', 'UserName', 'Password', 'URL', 'Notes', 'GKeyValue']
        for (let i = 0; i < delKey.length; i++) {
            const key = delKey[i];
            if (firstKey.indexOf(key) === -1) {
                delete entry.fields[key]
            }
        }
        gkv['icon'] = {}
        // 设置普通的值
        for (let i = 0; i < this.data.defaultList.length; i++) {
            const info: any = this.data.defaultList[i];
            gkv['icon'][info.key] = info.icon
            switch (info.valuetype) {
                case 'string':
                case 'txt':
                    entry.fields[info.key] = info.value
                    break;
                case 'pv':
                    entry.fields[info.key] = KdbxApi.getPassPV(info.value)
                    break;
            }
        }
        // 设置自定义字段 / 设置自定义字段的循序
        gkv['keystep'] = []
        for (let i = 0; i < this.data.otherList.length; i++) {
            const info: any = this.data.otherList[i]
            if (!$g.hasKey(gkv, 'icon')) gkv['icon'] = {}
            gkv['icon'][info.key] = info.icon
            gkv['keystep'].push(info.key)
            switch (info.valuetype) {
                case 'string':
                case 'txt':
                    entry.fields[info.key] = info.value
                    break;
                case 'pv':
                    entry.fields[info.key] = KdbxApi.getPassPV(info.value)
                    break;
            }
        }
        // 设置文件内容
        gkv['filelist'] = []
        for (let i = 0; i < this.data.fileList.length; i++) {
            const info: any = this.data.fileList[i]
            gkv['filelist'].push(info)
        }
        // 清理文件夹下不属于现在记录的内容以及历史记录中的文件

        entry.fields['GKeyValue'] = JSON.stringify(gkv)
        await DBItemApi.saveFileAddStorage(dbLib, dbItem)
        await $g.step.clear()
        dbItem.infoRefresh = true
        this.setData({ pagetype: 'show' })
        this.reLoadInfo()
    },
    btEdit(e: any) {
        $g.g.app.timeMouse = Date.now()
        this.setData({ pagetype: 'edit' })
    },
    /** 组件, 当台头输入框有变化的时候回调 */
    titleChange(e: any) {
        this.setData({
            icon: e.detail.icon,
            title: e.detail.title
        })
    },
    btDel(e: any) {
        $g.g.app.timeMouse = Date.now()
        const that = this
        wx.showModal({
            title: '提示',
            content: '你确定删除本条记录吗!',
            async success(e) {
                //开始设置
                await that.delEntry()
            }
        })
    },
    /** 点击查看历史的时候 */
    btShowHistory(e: any) {
        wx.navigateTo({
            url: `./entry?type=history&uuid=${this.data.uuid}&history=${e.currentTarget.dataset.index}`
        })
    },
    /** 恢复某一个历史数据 */
    btReHistory(e: any) {
        const copy: Entry = entry.history[Number(e.currentTarget.dataset.index)]
        entry.copyFrom(copy)
        this.setInfo()
    },
    /** 删除历史记录 */
    async btDelHistory(e: any) {
        entry.removeHistory(Number(e.currentTarget.dataset.index), 1)
        this.data.historyList.splice(Number(e.currentTarget.dataset.index), 1)
        this.setData({ historyList: this.data.historyList })
        await DBItemApi.saveFileAddStorage(dbLib, dbItem)
        await $g.step.clear()
    },
    /** 删除现在的这个对象 */
    async delEntry() {
        if (db && entry) {
            let recycleUUID: string = ''
            let entryUUID: string = ''
            if (entry.uuid && entry.uuid.id) entryUUID = entry.uuid.id
            const meta: any = db.meta
            if (meta && meta.recycleBinUuid) recycleUUID = meta.recycleBinUuid.id
            if (recycleUUID && entry.parentGroup && entry.parentGroup.uuid && entry.parentGroup.uuid.id === recycleUUID) {
                const _db: any = db
                _db.move(entry, null)
            } else {
                db.remove(entry)
            }
            if (entryUUID && dbItem.selectEntry && dbItem.selectEntry.uuid && dbItem.selectEntry.uuid.id === entryUUID) {
                dbItem.selectEntry = null
            }
            await DBItemApi.saveFileAddStorage(dbLib, dbItem)
            await $g.step.clear()
            dbItem.infoRefresh = true
            wx.navigateBack();
        }
    },
})
