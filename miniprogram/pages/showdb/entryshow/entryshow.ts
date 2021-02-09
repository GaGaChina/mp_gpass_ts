import { $g } from "../../../frame/speed.do"
import { WXFile } from "../../../frame/wx/wx.file"
import { GFileSize } from "../../../lib/g-byte-file/g.file.size"
import { DBItem, DBLib } from "../../../lib/g-data-lib/db"
import { KdbxApi } from "../../../lib/g-data-lib/kdbx.api"
import { KdbxIcon } from "../../../lib/g-data-lib/kdbx.icon"
import { Entry, Group, Kdbx } from "../../../lib/kdbxweb/types"

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
        /** 本页展示的UUID对象 */
        uuid: '',
        icon: '',
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
            $g.log('UUID : ', this.data.uuid);
        }
    },
    onShow() {
        //开始设置
        const findItem: Entry | null = this.getEntry()
        if (findItem) {
            this.setInfo(findItem as Entry)
        }
    },
    getEntry(): Entry | null {
        const dbLib: DBLib = $g.g.dbLib
        const dbItem: DBItem | null = dbLib.selectItem
        if (dbItem) {
            if (dbItem.db) {
                const root: Group = dbItem.db.groups[0]
                const findItem: Group | Entry | null = KdbxApi.findUUID(root, this.data.uuid);
                if (findItem) {
                    if ($g.isClass(findItem, 'KdbxEntry')) {
                        return findItem as Entry
                    } else {
                        $g.log('本类型不应该在本页面' + $g.className(findItem))
                    }
                } else {
                    wx.showToast({ title: '未找到对应子节点', icon: 'none', mask: false })
                }
            } else {
                wx.showToast({ title: '仓库的数据库并未解密', icon: 'none', mask: false })
            }
        } else {
            wx.showToast({ title: '未找到选择的仓库', icon: 'none', mask: false })
        }
        return null
    },
    setInfo(entry: Entry) {
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
            defaultList.push(this.getFieldKey(entry, gkv, firstKey[i]))
        }
        // --------------------------添加其他的字段
        const otherList: Array<Object> = new Array<Object>()
        const otherKey: Array<string> = Object.keys(entry.fields)
        for (let i = 0; i < otherKey.length; i++) {
            const key = otherKey[i];
            if (key !== 'GKeyValue' && key !== 'Title' && firstKey.indexOf(key) === -1) {
                otherList.push(this.getFieldKey(entry, gkv, key))
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
            icon: KdbxIcon.list[entry.icon],
            title: title,
            timeCreat: entry.times.creationTime.toLocaleString(),
            timeLastAccess: entry.times.lastAccessTime.toLocaleString(),
            timeLastMod: entry.times.lastModTime.toLocaleString(),
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
    getFieldKey(entry: Entry, gkv: any, key: string): Object {
        let display: string = ''
        let isPV: boolean = false
        let title: string = key
        switch (key) {
            case 'UserName':
                title = '用户名'
                break;
            case 'Password':
                title = '密　码'
                break;
            case 'Notes':
                title = '备　注'
                break;
            case 'URL':
                title = '网　址'
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
        let icon: string = ''
        if ($g.hasKey(gkv, 'icon') && $g.hasKey(gkv.icon, key)) {
            icon = gkv.icon[key]
        }
        let out: Object = {
            icon: icon,
            title: title,
            display: display,
            ispv: isPV,
        }
        return out
    },
    btBack(e: any){
        wx.navigateBack();
    },
    btEdit(e: any){
        
    },
    btDel(e: any) {
        const that = this
        wx.showModal({
            title: '提示',
            content: '你确定删除本条记录吗!',
            async success(e) {
                //开始设置
                const findItem: Entry | null = that.getEntry()
                if (findItem) {
                    const entry: Entry = findItem
                    const dbItem: DBItem = $g.g.dbLib.selectItem
                    const db: Kdbx | null = dbItem.db
                    if (db) {
                        db.remove(findItem)
                        await dbItem.saveFileAddStorage()
                    }
                    wx.navigateBack();
                }
            }
        })
    },


    /** 显示IOCN图标的窗口 */
    btSelectIcon(e: any) {
        $g.log('页面参数', this.data)
        this.setData({ openWinIcon: true })
    },
    changeTitleIcon(e: any) {
        $g.log(e.detail.index)
        this.setData({
            titleIcon: 0
        })
    }
})
