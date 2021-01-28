import { CallBackFunc } from "../tools/finish.callback";
import { $g } from "../speed.do";

export class WXUser {

    // 返回本地是否已经有了用户信息
    public static appHaveInfo(): boolean {
        return !!($g.a.globalData.userWX)
    }

    /**
     * 微信登录回调的信息,进行整理规整
     * @param res 
     */
    public static setUserInfo(res: WechatMiniprogram.GetUserInfoSuccessCallbackResult): boolean {
        if (res.userInfo) {
            console.log('[wx.userinfo]获取微信用户信息');
            $g.g.user.wxEncryptedData = res.encryptedData;
            $g.g.user.wxSignature = res.signature;
            $g.g.user.wxIv = res.iv;
            $g.g.userWX = res.userInfo;
            /*
            是否发现用户昵称和头像改变去登录状态
            if (res.userInfo.nickName != app.globalData.userInfo.nickName || res.userInfo.avatarUrl != app.globalData.userInfo.avatarUrl) {
                app.globalData.userJyjId = '';
                app.globalData.userJyjIdEncoded = '';
            }
            */
            //JyjUserSign.setStorageUserInfo();
            $g.s.copyGS('user', '*');
            $g.s.copyGS('userWX', '*');
            return true;
        } else {
            console.log('[wx.userinfo]未获取微信用户信息');
        }
        return false;
    }

    /**
     * 微信登录回调的信息,进行整理规整
     * @param res 
     */
    public static wxUserPhone(res: any): boolean {
        if ($g.hasKey(res, 'encryptedData') && $g.hasKey(res, 'iv')) {
            $g.log('[wx.userPhone]抽取微信用户信息');
            $g.s.g.user.wxEncryptedData = res.encryptedData;
            $g.s.g.user.wxIv = res.iv;
            $g.s.copyGS('user', '*');
            $g.s.copyGS('userWX', '*');
            return true;
        } else {
            $g.log('[wx.userPhone]未获取微信用户信息');
        }
        return false;
    }


    /** 给Code用的回调 */
    private static readonly wxCodeCallBack: CallBackFunc = new CallBackFunc();

    /**
     * 获取微信小程序 Code
     * @param finish 完成回调函数
     * @param clear 是否清理回调函数
     */
    public static wxCode(finish?: Function, clear: boolean = true): void {
        WXUser.wxCodeCallBack.add(finish, clear);
        wx.login({
            success: function (res) {
                console.log('[wx.login]获取code成功');
                $g.s.g.user.wxCode = res.code;
                WXUser.wxCodeCallBack.complete();
            },
            fail: function (res) {
                console.log('[wx.login]获取code失败');
                console.log(res);
                WXUser.wxCodeCallBack.clear();
            }
        });
    }

    /** 给Code用的回调 */
    private static readonly wxGetSettingCallBack: CallBackFunc = new CallBackFunc();
    /**
     * 授权用户自动调用获取用户信息
     * @param finish 
     * @param clear 
     */
    public static wxGetSetting(finish?: Function, clear: boolean = true): void {
        WXUser.wxGetSettingCallBack.add(finish, clear);
        wx.getSetting({
            success: res => {
                if (res.authSetting['scope.userInfo']) {
                    // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
                    wx.getUserInfo({
                        success: res => {
                            // 可以将 res 发送给后台解码出 unionId
                            WXUser.setUserInfo(res);
                            //$g.app.globalData.userWX = res.userInfo;
                            WXUser.wxGetSettingCallBack.complete();
                        },
                    })
                }
            },
        })
    }

    /** 给Code用的回调 */
    private static readonly wxUserInfoCallBack: CallBackFunc = new CallBackFunc();
    /**
     * 授权用户自动调用获取用户信息,可以将 res 发送给后台解码出 unionId
     * @param finish 
     * @param clear 
     */
    public static wxUserInfo(finish?: Function, clear: boolean = true): void {
        WXUser.wxUserInfoCallBack.add(finish, clear);
        wx.getUserInfo({
            success: res => {
                WXUser.setUserInfo(res);
                WXUser.wxUserInfoCallBack.complete();
            },
            fail: res => {
                WXUser.wxUserInfoCallBack.clear();
            },
            complete: res => {
                WXUser.wxUserInfoCallBack.clear();
            }
        })
    }
}