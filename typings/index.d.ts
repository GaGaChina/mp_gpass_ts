/// <reference path="./types/index.d.ts" />

// TS 版本里 解决 requirePlugin 错误
declare function requirePlugin<T>(name: string): T

interface IAppOption {
  globalData: {
    app: DataGlobalApp,
    user: DataGlobalUser,
    userWX?: WechatMiniprogram.UserInfo,
    /** 对象初始化的 DB 对象 */
    dbLib:any,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}