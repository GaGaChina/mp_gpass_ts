import { CallBackFunc } from "../tools/finish.callback";
import { $g } from "../speed.do";

/**
 * 2021年4月13日后发布新版本的小程序，无法通过wx.getUserInfo与<button open-type="getUserInfo"/>获取用户个人信息（头像、昵称、性别与地区），
 * 将直接获取匿名数据（包括userInfo与encryptedData中的用户个人信息），获取加密后的openID与unionID数据的能力不做调整
 */
export class WXUser {

    // 返回本地是否已经有了用户信息
    public static appHaveInfo(): boolean {
        return !!($g.a.globalData.userWX)
    }

    /**
     * 新版的获取用户数据
     * https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/wx.getUserProfile.html
     * https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/UserInfo.html
     * @param desc 获取用户信息的时候给用户的提示
     */
    public static getUserInfo(desc: string): Promise<boolean> {
        return new Promise(async function (resolve) {
            wx.getUserProfile({
                // 获取用户信息的时候的说明
                desc: desc,
                success(e: any) {
                    $g.log('[wx.getUserInfo]success', e)
                },
                fail(e: any) {

                }
            })
            return resolve(false)
        })
    }



    /**
     * 微信登录回调的信息,进行整理规整
     * @param res 
     */
    public static setUserInfo(res: WechatMiniprogram.GetUserInfoSuccessCallbackResult): boolean {
        $g.log('[wx.userinfo]', res)
        if (res.userInfo) {
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
     * wx.getUserInfo 
     */
    public static wxGetSetting(): void {
        wx.getSetting({
            success: res => {
                if (res.authSetting['scope.userInfo']) {
                    // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
                    wx.getUserInfo({
                        success: res => {
                            // 可以将 res 发送给后台解码出 unionId
                            WXUser.setUserInfo(res);
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