import { $g } from "../speed.do";

/**
 * 开启防休眠
 */
export class WXKeepScreen {

    /** 记录现在是否开启了休眠 */
    private static isOpen: boolean = false

    /** 是否启用锁定, 当设置后, 只有 lock 一样才能打开 */
    private static lock: string = ''

    /** 打开防止休眠 */
    public static on(lock: string = ''): Promise<boolean> {
        return new Promise(resolve => {
            if (WXKeepScreen.lock === '') {
                wx.setKeepScreenOn({
                    keepScreenOn: true,
                    success(res) {
                        WXKeepScreen.isOpen = true
                        $g.log('[wx.keep][open][success]', res)
                        WXKeepScreen.lock = lock
                        resolve(true)
                    },
                    fail(e) {
                        $g.log('[wx.keep][open][fail]', e)
                        WXKeepScreen.lock = lock
                        resolve(false)
                    }
                })
            }
        })
    }

    /** 关闭防止休眠 */
    public static off(lock: string = ''): Promise<boolean> {
        return new Promise(resolve => {
            if (lock === '' || lock === WXKeepScreen.lock) {
                wx.setKeepScreenOn({
                    keepScreenOn: false,
                    success(res) {
                        WXKeepScreen.isOpen = false
                        $g.log('[wx.keep][open][success]', res)
                        WXKeepScreen.lock = ''
                        return resolve(true)
                    },
                    fail(e) {
                        $g.log('[wx.keep][open][fail]', e)
                        WXKeepScreen.lock = ''
                        return resolve(false)
                    }
                })
            } else {
                return resolve(false)
            }
        })
    }
}