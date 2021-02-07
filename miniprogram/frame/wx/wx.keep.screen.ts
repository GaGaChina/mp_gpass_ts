import { $g } from "../speed.do";

/**
 * 开启防休眠
 */
export class WXKeepScreen {
    private static isOpen: boolean = false

    /** 打开防止休眠 */
    public static on(): Promise<boolean> {
        return new Promise(resolve => {
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
        })
    }

    /** 关闭防止休眠 */
    public static off(): Promise<boolean> {
        return new Promise(resolve => {
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
        })
    }
}