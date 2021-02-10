import { $g } from "../../../frame/speed.do"
import { TimeFormat } from "../../../frame/time/time.format"
import { GFileSize } from "../../../lib/g-byte-file/g.file.size"
import { DBItem, DBLib } from "../../../lib/g-data-lib/db"
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
        /** 选择操作的父级 */
        uuidGroup: '',
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
                title = '添加新条目'
            } else if (type === 'show') {
                title = '条目展示'
            } else if (type === 'edit') {
                title = '条目编辑'
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
        if ($g.hasKey(query, 'group')) {
            this.data.uuidGroup = String(query.group)
            let length = this.data.uuidGroup.length % 4
            if (length > 0) {
                while (++length < 5) {
                    this.data.uuidGroup += '='
                }
            }
        }
        // 设置默认的
        dbLib = $g.g.dbLib
        const select: any = dbLib.selectItem
        if (select) {
            dbItem = select
            if (dbItem.db) db = dbItem.db
        }
        // 没有设置会返回
        if (!db) {
            wx.navigateBack()
        }
    },
    onShow() {
        switch (this.data.pagetype) {
            case 'show':
                const findEntry: any = KdbxApi.findUUID(db.groups[0], this.data.uuid)
                if (findEntry && $g.isClass(findEntry, 'KdbxEntry')) {
                    entry = findEntry
                    entry.times.lastAccessTime = new Date()
                    this.setInfo()
                } else {
                    wx.navigateBack()
                }
                break;
            default:
                $g.log('未找到类型 : ' + this.data.pagetype)
        }
    },
    onUnload() {
        var theNull: any = null
        dbLib = theNull
        dbItem = theNull
        db = theNull
    },
    setInfo() {
        $g.log('解析条目 : ', entry)
        // --------------------------设置标题
        let title: string = ''
        if ($g.isClass(entry.fields?.Title, 'ProtectedValue')) {
            title = '***'
        } else {
            title = String(entry.fields?.Title)
        }
        // --------------------------特殊意义对象
        let gkv: any = {}
        if ($g.hasKey(entry.fields, 'GKeyValue')) {
            const gkvJSON: any = entry.fields['GKeyValue']
            gkv = JSON.parse(gkvJSON)
        }
        // --------------------------其他字段为特殊字段
        const defaultList: Array<Object> = new Array<Object>()
        const firstKey: Array<string> = ['UserName', 'Password', 'URL', 'Notes']
        for (let i = 0; i < firstKey.length; i++) {
            defaultList.push(this.getFieldKey(gkv, firstKey[i]))
        }
        // --------------------------添加其他的字段
        const otherList: Array<Object> = new Array<Object>()
        const otherKey: Array<string> = Object.keys(entry.fields)
        for (let i = 0; i < otherKey.length; i++) {
            const key = otherKey[i];
            if (key !== 'GKeyValue' && key !== 'Title' && firstKey.indexOf(key) === -1) {
                otherList.push(this.getFieldKey(gkv, key))
            }
        }
        // --------------------------添加附件
        const fileList: Array<Object> = new Array<Object>()
        const binaries: any = entry.binaries
        const fileKeyList: Array<string> = Object.keys(binaries)
        for (let i = 0; i < fileKeyList.length; i++) {
            const fileName: string = fileKeyList[i]
            const fileInfo: any = binaries[fileName]
            let byte: ArrayBuffer = fileInfo.value
            const fileItem: object = {
                nameall: fileName,
                ref: fileInfo.ref,
                isbyte: true,
                path: '',
                size: GFileSize.getSize(byte.byteLength, 3),
            }
            this.checkFileItem(fileList, fileItem)
        }
        // --------------------------添加 GKeyValue 的文件
        if ($g.hasKey(gkv, 'file')) {
            const gkvFileList: [] = gkv['file']
            for (let i = 0; i < gkvFileList.length; i++) {
                const gkvFileItem: any = gkvFileList[i];
                const fileItem: object = {
                    nameall: gkvFileItem.name,
                    ref: gkvFileItem.ref,
                    isbyte: false,
                    path: gkvFileItem.path,
                    size: GFileSize.getSize(gkvFileItem.size, 3),
                }
                this.checkFileItem(fileList, fileItem)
            }
        }
        // --------------------------添加历史记录
        const historyList: Array<Object> = new Array<Object>()
        if (entry.history.length) {

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
    /** 对文件信息进行进一步的加工 */
    checkFileItem(fileList: any, item: any) {
        const fileName: string = item.nameall
        const fileNameArr: Array<string> = fileName.split('.')
        // 文件扩展名
        let fileTypeName: string = ''
        if (fileNameArr.length > 1) {
            fileTypeName = fileNameArr[fileNameArr.length - 1]
            fileNameArr.pop()
        }
        let fileNameClear: string = fileNameArr.join('.')
        let fileIcon: string = ''
        let fileType: string = ''
        fileTypeName = fileTypeName.toLocaleLowerCase()
        switch (fileTypeName) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'bmp':
            case 'gif':
                fileType = 'image'
                fileIcon = 'file-photo-o'
                break;
            case 'txt':
                fileType = 'txt'
                fileIcon = 'file-text-o'
                break;
            case 'mp3':
                fileType = 'sound'
                fileIcon = 'file-sound-o'
                break;
            case 'mp4':
                fileType = 'movie'
                fileIcon = 'file-movie-o'
                break;
            case 'doc':
            case 'docx':
                fileType = 'word'
                fileIcon = 'file-word-o'
                break;
            case 'xlsx':
                fileType = 'excel'
                fileIcon = 'file-excel-o'
                break;
            case 'pdf':
                fileType = 'pdf'
                fileIcon = 'file-pdf-o'
                break;
            default:
                break;
        }
        item['name'] = fileNameClear
        item['icon'] = fileIcon
        item['type'] = fileType
        fileList.push(item)
    },

    /**
     * 
     * @param key 
     */
    getFieldKey(gkv: any, key: string): Object {
        let display: string = ''
        let isPV: boolean = false
        let title: string = key
        let def_icon: string = ''
        switch (key) {
            case 'UserName':
                title = '用户名'
                def_icon = 'user'
                break;
            case 'Password':
                title = '密　码'
                def_icon = 'key'
                break;
            case 'Notes':
                title = '备　注'
                def_icon = 'key'
                break;
            case 'URL':
                title = '网　址'
                def_icon = 'key'
                break
        }
        if (entry.fields && $g.hasKey(entry.fields, key)) {
            const item: any = entry.fields[key]
            if ($g.isClass(item, 'ProtectedValue')) {
                isPV = true
                display = '******'
            } else {
                display = item
            }
        }
        // 从 gkv 中取出 icon的设置
        if ($g.hasKey(gkv, 'icon') && $g.hasKey(gkv.icon, key)) {
            def_icon = gkv.icon[key]
        }
        let out: Object = {
            icon: def_icon,
            title: title,
            display: display,
            ispv: isPV,
        }
        return out
    },
    btBack(e: any) {
        wx.navigateBack();
    },
    btSave(e: any) {
        $g.log('[entry][Save]', this.data.title)
        entry.pushHistory()
        entry.times.update()
        entry.icon = this.data.icon
        entry.fields.Title = this.data.title
        dbItem.saveFileAddStorage()
        this.setData({ pagetype: 'show' })
    },
    btEdit(e: any) {
        if (this.data.pagetype === 'show') {
            this.setData({ pagetype: 'edit' })
        } else {
            this.setData({ pagetype: 'show' })
        }

        // wx.navigateTo({
        //     url: './../entryedit/entryedit?uuid=' + this.data.uuid
        // })
    },
    btDel(e: any) {
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
    /** 删除现在的这个对象 */
    async delEntry() {
        if (db && entry) {
            db.remove(entry)
            await dbItem.saveFileAddStorage()
            wx.navigateBack();
        }
    },
})
