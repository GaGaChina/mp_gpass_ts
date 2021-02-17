interface DataGlobalApp {
    /** API接口的基础地址 */
    urlApi: string,
    /** 图片基础地址 */
    urlImg: string,
    /** APP的ID号 */
    id: string,
    /** APP的版本号 */
    ver: string,
    /** 是否使用本地模式, 就是脱网运行 */
    local: boolean,
    /** 是否是DEBUG模式 */
    DEBUG: boolean,
    /** 测试的时间统计默认心跳(毫秒) */
    test_heart: number,
    /** 场景相关的参数 */
    scene: DataScene,
    /** 是否启用 dark 模式 */
    darkusable: boolean,
    /** 用户设置的暗黑模式, 0 自动, 1 白色, 2 暗黑 */
    darktype: number,
    /** 是否开启暗黑模式 */
    darkmode: boolean,
    /** 用户上一次操作的时间, g-page-bg 组件会更新时间 */
    timeMouse: number,
    /** 用户多久不操作进行锁屏 */
    timeMouseClose: number,
    /** 倒数为 0 的时候弹出 指纹 或 人脸识别解锁 */
    timesShowFinger:number,
}

/** 用户数据相关内容 */
interface DataGlobalUser {
    /** 服务器数据库用户ID号 */
    id: string,
    /** 微信授权获取的登录信息 */
    wx?: WechatMiniprogram.UserInfo,
    /** 微信登录后获取的Data */
    wxEncryptedData?: string,
    /** 微信登录后获取 */
    wxSignature?: string,
    /** 微信登录后获取 */
    wxIv?: string,
    /** 微信获取Code */
    wxCode?: string,
    //推广人id
    promoter?: DataGlobalPromoter,
}

/** 推广员相关信息 */
interface DataGlobalPromoter {
    /** 推广员用户ID号,去掉前后6位数字 */
    id: number,
    /** 用户登录成功是否已经发送过推广员信息 */
    SendLogin: boolean,
    /** 机器启动是否发送过推广员信息 */
    SendProm: boolean,
}

interface DataScene {
    /** px → rpx 的比例 * 1000, px * 值 / 1000 = rpx */
    pxRpx: number,
    /** [单位 rpx] 台头 Bar 有系统信息部分所占的高度 */
    topBarHeight: number,
    /** [单位 rpx] 台头 Bar 组件单独占用高度(不含 topBarHeight) */
    topBarTop: number,
    /** [单位 rpx] 下面 Bar 所占的高度 */
    endBarHeight: number,
    /** [单位 rpx] 整个窗口的高度 */
    winHeight: number,
}