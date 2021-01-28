import { $g } from "../../../frame/speed.do";
import { WXFile } from "./../../../frame/wx/wx.file";
import { KdbxApi } from "../../../lib/g-data-lib/kdbx.api";
import { Kdbx } from "../../../lib/kdbxweb/types/index";
import { WXSoterAuth } from "../../../frame/wx/wx.soter.auth";
import { EncodingIndexes } from "../../../lib/text-encoding/EncodingIndexes";
import { WXSize } from "../../../frame/wx/wx.resize";
import { DBItem, DBLib } from "../../../lib/g-data-lib/db.lib";



Page({
    data: {
        fullPageHeight: 0,
        centerPageHeight: 0,
        dbEmpty: true,
        vtabsTitle: [{ title: '标题' }, { title: '标题1' }, { title: '标题3' }]
    },
    onLoad() {
        const scene: DataScene = $g.g.app.scene
        const fullHeight: number = scene.winHeight - scene.topBarHeight - scene.topBarTop
        const centerHeight: number = fullHeight - 160
        this.setData({
            fullPageHeight: fullHeight,
            centerPageHeight: centerHeight
        })
        // 设置数据库
        const dbLib: DBLib = $g.g.dbLib
        const dbItem: DBItem | null = dbLib.selectDB
        if (dbItem?.db) {
            this.setData({
                dbEmpty: KdbxApi.isEmpty(dbItem.db),
            })
        }
    },
    /** 添加一条记录 */
    btAddItem(e: any) {
        $g.log(e)
        let type: string = String(e.currentTarget.dataset.type)
        wx.navigateTo({
            url: './../add/add?type=add&infoType=bank'
        })
    },
    btEndAdd(e: any) {
        wx.navigateTo({
            url: './../add/add?type=add'
        })
    },
    btShowDbList(e: any) {
        wx.navigateTo({
            url: './../dblist/dblist'
        })
    }
})
