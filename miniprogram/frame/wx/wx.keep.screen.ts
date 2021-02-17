import { $g } from "../speed.do";

/**
 * 开启防休眠
 */
export class WXKeepScreen {

    /** 记录现在是否开启了休眠 */
    private static isOpen: boolean = false

    /** 打开防止休眠 */
    public static on(): Promise<boolean> {
        return new Promise(resolve => {
            if (WXKeepScreen.isOpen) {

                wx.setKeepScreenOn({
                    keepScreenOn: true,
                    success(res) {
                        WXKeepScreen.isOpen = true
                        $g.log('[wx.keep][open][success]', res)
                        resolve(true)
                    },
                    fail(err) {
                        $g.log('[wx.keep][open][fail]', err)
                        resolve(false)
                    }
                })
            } else {
                resolve(true)
            }
        })
    }

    /** 关闭防止休眠 */
    public static off(): Promise<boolean> {
        return new Promise(resolve => {
            if (WXKeepScreen.isOpen) {
                wx.setKeepScreenOn({
                    keepScreenOn: false,
                    success(res) {
                        WXKeepScreen.isOpen = false
                        $g.log('[wx.keep][open][success]', res)
                        resolve(true)
                    },
                    fail(err) {
                        $g.log('[wx.keep][open][fail]', err)
                        resolve(false)
                    }
                })
            } else {
                resolve(true)
            }
        })
    }
}