/// <reference path="./types/index.d.ts" />

// TS 版本里 解决 requirePlugin 错误
declare function requirePlugin<T>(name: string): T

interface IAppOption {
  globalData: {
    app: DataGlobalApp,
    user: DataGlobalUser,
    userWX?: WechatMiniprogram.UserInfo,
    /** 资料库 */
    glib: any,
    /** Kdbx 信息 */
    db:any,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}