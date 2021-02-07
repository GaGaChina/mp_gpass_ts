import { $g } from "../../../frame/speed.do"
import { DBItem, DBLib } from "../../../lib/g-data-lib/db"
import { KdbxApi } from "../../../lib/g-data-lib/kdbx.api"
import { KdbxIcon } from "../../../lib/g-data-lib/kdbx.icon"
import { Entry, Group } from "../../../lib/kdbxweb/types"

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
 * 
 */
Page({
    data: {
        fullPageHeight: 0,
        /** 本页展示的UUID对象 */
        uuid: '',
        icon: '',
        title: '',
        defaultList: new Array<Object>(),
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
        //开始设置
        const dbLib: DBLib = $g.g.dbLib
        const dbItem: DBItem | null = dbLib.selectItem
        if (dbItem) {
            if (dbItem.db) {
                const root: Group = dbItem.db.groups[0]
                const findItem: Group | Entry | null = KdbxApi.findUUID(root, this.data.uuid);
                if (findItem) {
                    if ($g.isClass(findItem, 'KdbxEntry')) {
                        this.setInfo(findItem as Entry)
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
    },
    setInfo(entry: Entry) {
        let title: string = ''
        if ($g.isClass(entry.fields?.Title, 'ProtectedValue')) {
            title = '***'
        } else {
            title = String(entry.fields?.Title)
        }
        // 特殊意义对象
        let gkv: any = {}
        if ($g.hasKey(entry.fields, 'GKeyValue')) {
            const gkvJSON: any = entry.fields['GKeyValue']
            gkv = JSON.parse(gkvJSON)
        }
        // 其他字段为特殊字段
        const defaultList: Array<Object> = new Array<Object>()
        defaultList.push(this.getFieldKey(entry, 'UserName'))
        defaultList.push(this.getFieldKey(entry, 'Password'))
        defaultList.push(this.getFieldKey(entry, 'URL'))
        defaultList.push(this.getFieldKey(entry, 'Notes'))

        this.setData({
            icon: KdbxIcon.list[entry.icon],
            title: title,
            defaultList: defaultList,
            
        })
    },
    /**
     * 
     * @param key 
     */
    getFieldKey(entry: Entry, key: string): Object {
        let display: string = ''
        let icon: string = ''
        let isPass: boolean = false
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
                isPass = true
                display = '******'
            } else {
                display = item
            }
        }
        let out: Object = {
            icon: icon,
            title: title,
            display: display,
            ispass: isPass,
        }
        return out
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
