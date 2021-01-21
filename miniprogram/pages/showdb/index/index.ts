import { $g } from "../../../frame/speed.do";
import { WXFile } from "./../../../frame/wx/wx.file";
import { KdbxApi } from "../../../lib/g-data-lib/kdbx.api";
import { Kdbx } from "../../../lib/kdbxweb/types/index";
import { WXSoterAuth } from "../../../frame/wx/wx.soter.auth";
import { EncodingIndexes } from "../../../lib/text-encoding/EncodingIndexes";
import { WXSize } from "../../../frame/wx/wx.resize";

let db:Kdbx = $g.globalData.db

Page({
    data: {
        fullPageHeight: 0,
        centerPageHeight: 0,
        dbEmpty: true,
        vtabsTitle: [{ title: '标题' }, { title: '标题1' }, { title: '标题3' }]
    },
    onLoad() {
        const scene: DataScene = $g.globalData.app.scene
        const fullHeight:number = scene.winHeight - scene.topBarHeight - scene.topBarTop
        const centerHeight:number = fullHeight - 160
        this.setData({
            dbEmpty: KdbxApi.isEmpty(db),
            fullPageHeight: fullHeight,
            centerPageHeight: centerHeight
        })
    },
    /** 添加一条记录 */
    btAddItem(e:any){
        $g.log(e)
        let type: string = String(e.currentTarget.dataset.type)
        wx.navigateTo({
            url: './../add/add?type=add&infoType=bank'
        }) 
    }
})
