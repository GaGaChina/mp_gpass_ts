import { $g } from "../speed.do";

export class WXClipboard {


    /**
     * 将str信息设置到剪切板
     * @param str 
     */
    public static setDate(str: string): Promise<boolean> {
        return new Promise(resolve => {
            wx.setClipboardData({
                data: str,
                success(res: WechatMiniprogram.GeneralCallbackResult) {
                    resolve(true)
                },
                fail: (e: WechatMiniprogram.GeneralCallbackResult) => {
                    $g.log('[WXClipboard][setDate][fail]', e);
                    resolve(false)
                }
            })
        })
    }




}