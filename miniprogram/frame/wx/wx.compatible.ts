import { $g } from "../speed.do";

/**
 * 统一的兼容处理
 * 
 * 导入 WXCompatible 库
 * import { WXCompatible } from "./wx.compatible";
 * if (!WXCompatible.canRun('1.9.9', '无法启用File。')) return resolve(false)
 */
export class WXCompatible {

    /** 本机的基础库版本号 */
    public static SDKVersion: string = wx.getSystemInfoSync().SDKVersion

    /**
     * 判断本函数是否可以运行
     * @param ver 给出最低可以运行的版本
     * @param msg 额外的信息
     */
    public static canRun(ver: string, msg: string = ''): boolean {
        if (WXCompatible.compareVersion(WXCompatible.SDKVersion, ver) >= 0) {
            return true
        } else {
            // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样子提示
            console.log('版本号 SDKVersion : ', WXCompatible.SDKVersion)
            let content: string = '微信版本 ' + WXCompatible.SDKVersion + ' 过低，请升级微信！'
            if (msg) {
                content = content + msg + '需版本:' + ver
            }
            wx.showModal({
                title: '功能无法开启',
                content: content
            })
        }
        return false
    }

    /**
     * 判断版本1是否大于版本2, 1大于, 0等于, -1小于
     * 版本号 000.000.000
     * @param v1 版本1
     * @param v2 版本2
     */
    public static compareVersion(v1: string, v2: string): number {
        let a1: string[] = v1.split('.')
        let a2: string[] = v2.split('.')
        const len = Math.max(v1.length, v2.length)
        while (a1.length < len) {
            a1.push('0')
        }
        while (a2.length < len) {
            a2.push('0')
        }
        for (let i = 0; i < len; i++) {
            const num1: number = parseInt(a1[i])
            const num2: number = parseInt(a2[i])
            if (num1 > num2) {
                return 1
            } else if (num1 < num2) {
                return -1
            }
        }
        return 0
    }

}