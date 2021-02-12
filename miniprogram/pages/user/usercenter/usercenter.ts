import { WXClipboard } from "../../../frame/wx/wx.clipboard";
import { WXShare, WXShareData } from "../../../frame/wx/wx.share";
import { $g } from "./../../../frame/speed.do";

import { ToolString } from "./../../../frame/tools/tool.string";

// 获取应用实例
Page({
    data: {
        avatarUrl: '',
        nickName: '请登录',
        DEBUG: $g.g.app.DEBUG,
        version: $g.g.app.ver
    },
    onLoad(options: any) {
        if ($g.s.g.userWX) {
            this.setData({
                avatarUrl: $g.s.g.userWX.avatarUrl,
                nickName: $g.s.g.userWX.nickName
            });
        }
    },
    btClearClipboard(e: any) {
        WXClipboard.setDate('')
    },
    onShareAppMessage(e: any): any {
        $g.log('用户点击分享:', e)
        const shareData: WXShareData = new WXShareData()
        shareData.title = '密码档案'
        shareData.desc = '记录帐号密码的好工具'
        shareData.path = '/pages/index/index'
        shareData.imageUrl = '/img/share/home.jpg'
        return WXShare.runObj(shareData);
    }
})