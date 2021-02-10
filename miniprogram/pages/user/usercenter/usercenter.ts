import { WXClipboard } from "../../../frame/wx/wx.clipboard";
import { $g } from "./../../../frame/speed.do";

import { ToolString } from "./../../../frame/tools/tool.string";

// 获取应用实例
Page({
    data: {
        avatarUrl: '',
        nickName: '请登录',
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
})