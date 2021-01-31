import { $g } from "../../../frame/speed.do"
import { DBItem, DBLib } from "../../../lib/g-data-lib/db"

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
        centerPageHeight: 0,
        /** 是否是添加条目 */
        isAdd: true,
        /** 是否显示选择ICON的窗口 */
        openWinIcon: false,
        /** 标题的Icon索引Index */
        titleIcon: 0,
    },
    onLoad() {
        const scene: DataScene = $g.g.app.scene
        const fullHeight: number = scene.winHeight - scene.topBarHeight - scene.topBarTop
        const centerHeight: number = fullHeight - 160
        this.setData({
            fullPageHeight: fullHeight,
            centerPageHeight: centerHeight
        })
        const dbLib: DBLib = $g.g.dbLib
        if (dbLib.selectDB) {
            const dbItem: DBItem = dbLib.selectDB
            $g.log(dbItem)
        }
        //const item:Entry = db.groups[0].groups[0].entries[0]
        //const itemF:{[key: string]: StringProtected;} = item.fields[0]
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
