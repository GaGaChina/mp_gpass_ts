import { $g } from "../speed.do"

export class WXSystemInfo {

    /** 同步获取系统信息 */
    public static getSync(): WechatMiniprogram.GetSystemInfoSyncResult {
        return wx.getSystemInfoSync()
    }

    /** 展示出全部信息 */
    public static showLog(o: WechatMiniprogram.GetSystemInfoSyncResult): void {
        try {
            // $g.log('[WX系统信息]', o)
            const c: any = o
            let s: string = '[WX系统信息]\r\n'
            s += '[设备品牌]' + o.brand + '\r\n'
            s += '[设备型号]' + o.model + '\r\n'
            s += '[设备像素比]' + o.pixelRatio + '\r\n'
            s += '[屏幕宽度px]' + o.screenWidth + '\r\n'
            s += '[屏幕高度px]' + o.screenHeight + '\r\n'
            s += '[窗口宽度px]' + o.windowWidth + '\r\n'
            s += '[窗口高度px]' + o.windowHeight + '\r\n'
            s += '[状态栏高度px]' + o.statusBarHeight + '\r\n'
            s += '[微信语言]' + o.language + '\r\n'
            s += '[微信版本]' + o.version + '\r\n'
            s += '[基础库版本]' + o.SDKVersion + '\r\n'
            s += '[操作系统及版本]' + o.system + '\r\n'
            s += '[客户端平台]' + o.platform + '\r\n'
            s += '[用户字体大小px]' + o.fontSizeSetting + '\r\n'// 以微信客户端「我-设置-通用-字体大小」中的设置为准
            s += '[性能等级]' + o.benchmarkLevel + '\r\n'// （仅 Android）。值为：-2 或 0（该设备无法运行小游戏），-1（性能未知），>=1（设备性能值，该值越高，设备性能越好，目前最高不到50）
            s += '[相册权限]' + o.albumAuthorized + '\r\n'// 允许微信使用相册的开关（仅 iOS 有效）
            s += '[摄像头权限]' + o.cameraAuthorized + '\r\n'// 允许微信使用摄像头的开关
            s += '[定位权限]' + o.locationAuthorized + '\r\n'// 允许微信使用定位的开关
            s += '[麦克风权限]' + o.microphoneAuthorized + '\r\n'// 允许微信使用麦克风的开关
            s += '[通知权限]' + o.microphoneAuthorized + '\r\n'// 允许微信通知的开关
            s += '[通知提醒权限]' + o.notificationAlertAuthorized + '\r\n'// 允许微信通知带有提醒的开关（仅 iOS 有效）
            s += '[通知标记权限]' + o.notificationBadgeAuthorized + '\r\n'// 允许微信通知带有标记的开关（仅 iOS 有效）
            s += '[通知声音权限]' + o.notificationSoundAuthorized + '\r\n'// 允许微信通知带有声音的开关（仅 iOS 有效）
            s += '[蓝牙权限]' + o?.bluetoothEnabled + '\r\n'// 蓝牙的系统开关
            s += '[位置权限]' + o?.locationEnabled + '\r\n'// 地理位置的系统开关
            s += '[Wi-Fi权限]' + o?.wifiEnabled + '\r\n'// Wi-Fi 的系统开关
            s += '[安全区域]' + o?.safeArea + '\r\n'// 在竖屏正方向下的安全区域
            s += '[定位模式]' + c?.locationReducedAccuracy + '\r\n'// true 表示模糊定位，false 表示精确定位，仅 iOS 支持
            s += '[黑暗模式]' + c?.theme + '\r\n'// 系统当前主题，取值为light或dark，全局配置"darkmode":true时才能获取，否则为 undefined （不支持小游戏）
            s += '[是否调试]' + c?.enableDebug + '\r\n'// 是否已打开调试。可通过右上角菜单或 wx.setEnableDebug 打开调试
            $g.log(s)
        } catch (e) {
            // Do something when catch error
        }
    }

}