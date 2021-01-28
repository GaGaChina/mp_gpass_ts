import { $g } from "../speed.do";

export class WXSize {

    /** 初始化并监听窗口尺寸变化 */
    public static init() {
        WXSize.getSize();
        wx.onWindowResize(WXSize.resize);
    }

    private static resize(size: WechatMiniprogram.OnWindowResizeCallbackResult): void {
        $g.log(size)
        WXSize.getSize();
    }

    /**
     * 重新获取窗口尺寸
     */
    public static getSize() {
        const info = wx.getSystemInfoSync();
        $g.log('wx.getSystemInfoSync : ', info);
        // px → rpx 的比例, px * 值 = rpx
        const scene: DataScene = $g.s.g.app.scene
        scene.pxRpx = 750 / info.windowWidth * 1000
        scene.topBarHeight = ~~(info.statusBarHeight * scene.pxRpx) / 1000
        scene.endBarHeight = ~~((info.screenHeight - info.windowHeight - info.statusBarHeight) * scene.pxRpx) / 1000
        scene.winHeight = ~~(info.windowHeight * scene.pxRpx) / 1000
        $g.log(`TopBar:${scene.topBarHeight}, EndBar:${scene.endBarHeight},窗口高度:${scene.winHeight}`);
    }
}