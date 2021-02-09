import { $g } from "../speed.do";
import { WXSystemInfo } from "./wx.system.info";

export class WXSize {

    /** 初始化监听窗口尺寸变化 */
    public static init() {
        wx.onWindowResize(WXSize.resize);
    }

    /** 当尺寸变化的时候回调函数 */
    public static resize(size: WechatMiniprogram.OnWindowResizeCallbackResult): void {
        $g.g.systemInfo = WXSystemInfo.getSync()
        $g.log('[WXSize]size', size)
        $g.log('[WXSize]systemInfo', $g.g.systemInfo)
        WXSize.getSize($g.g.systemInfo);
    }

    /**
     * 重新获取窗口尺寸
     */
    public static getSize(info: WechatMiniprogram.GetSystemInfoSyncResult) {
        // px → rpx 的比例, px * 值 = rpx
        const scene: DataScene = $g.s.g.app.scene
        scene.pxRpx = 750 / info.windowWidth * 1000
        scene.topBarHeight = ~~(info.statusBarHeight * scene.pxRpx) / 1000
        scene.endBarHeight = ~~((info.screenHeight - info.windowHeight - info.statusBarHeight) * scene.pxRpx) / 1000
        scene.winHeight = ~~(info.windowHeight * scene.pxRpx) / 1000
        $g.log(`TopBar:${scene.topBarHeight}, EndBar:${scene.endBarHeight},窗口高度:${scene.winHeight}`);
    }
}