import { WXClipboard } from "../../../frame/wx/wx.clipboard";
import { WXShare, WXShareData } from "../../../frame/wx/wx.share";
import { WXUser } from "../../../frame/wx/wx.user";
import { $g } from "./../../../frame/speed.do";

import { ToolString } from "./../../../frame/tools/tool.string";

// 获取应用实例
Page({
    data: {
        DEBUG: $g.g.app.DEBUG,
        version: $g.g.app.ver,
        hasWXUser: false,// 是否有微信登录信息
        userHead: '',
        nickName: '请登录',
    },
    onLoad() {
        this.setData({
            hasWXUser: WXUser.appHaveInfo(),
            userHead: $g.g.userWX?.avatarUrl ?? '',
            nickName: $g.g.userWX?.nickName ?? ''
        })
    },
    btClearClipboard(e: any) {
        WXClipboard.setDate('')
    },
    /** 用户分享的信息 */
    onShareAppMessage(e: any): any {
        $g.log('用户点击分享:', e)
        const shareData: WXShareData = new WXShareData()
        shareData.title = '密码档案'
        shareData.desc = '记录帐号密码的好工具'
        shareData.path = '/pages/index/index'
        shareData.imageUrl = '/img/share/home.jpg'
        return WXShare.runObj(shareData);
    },
    btGetUserInfo(e: any) {
        console.log('点击微信授权 : ', e);
        WXUser.setUserInfo(e.detail);
        this.callSetData();
    },
    callSetData() {
        if (WXUser.appHaveInfo()) {
            this.setData({
                hasWXUser: true,
                userHead: $g.g.userWX?.avatarUrl,
                nickName: $g.g.userWX?.nickName
            })
        }
    },
})