import { $g } from "./frame/speed.do"
import { WXSoterAuth } from "./frame/wx/wx.soter.auth"
import { WXUser } from "./frame/wx/wx.user"
import { WXFile } from "./frame/wx/wx.file"
import { WXSize } from "./frame/wx/wx.resize"
import { DBLib } from "./lib/g-data-lib/db"
import { WXSystemInfo } from "./frame/wx/wx.system.info"

App<IAppOption>({
    globalData: {
        app: {
            urlApi: '',
            urlImg: '',
            id: 'wx98e663f2bb3467bd',
            ver: '1.3.0',
            local: false,
            DEBUG: true,
            test_heart: 100,
            scene: {
                pxRpx: 0,
                winHeight: 0,
                topBarHeight: 0,
                topBarTop: 80,
                endBarHeight: 0
            },
            darkusable: false,
            darktype: 0,
            darkmode: true,
            timeMouse: Date.now(),
            timeMouseClose: 300000,
            timesShowFinger: 5,
        },
        systemInfo: WXSystemInfo.getSync(),
        user: {
            id: ''
        },
        dbLib: new DBLib(),
    },
    async onLaunch() {
        $g.init(this)
        WXSize.init()
        WXSize.getSize(this.globalData.systemInfo)
        WXSystemInfo.showLog(this.globalData.systemInfo)
        // 获取 Storage 档案数据来设置内存
        const dbLib: DBLib = this.globalData.dbLib
        dbLib.storageSetThis()
        await WXFile.rmDir('temp', true)
        await dbLib.checkFile()
        //dbLib.fileSizeRun()
        // 版本升级需要维护本地缓存数据
        const storageVer: any = $g.s.getS('app.ver')
        $g.log('版本 : ' + this.globalData.app.ver + ' → ' + storageVer)
        if (storageVer !== this.globalData.app.ver) {
            $g.log('数据版本升级')
            // 将 storage 数据拷贝到内存
            $g.s.copySG('user', '*,!id,!wx,!wxEncryptedData,!wxSignature,!wxIv,!wxCode,!promoter')
            // 清理 storage 数据
            $g.s.storageClear()
            // 写回 storage 数据
            dbLib.storageSaveThis()
            $g.s.copyGS('app', 'ver')
            $g.s.copyGS('user', '*')
            $g.s.copyGS('userWX', '*')
        } else {
            dbLib.storageSaveThis()
            // 读取缓存中的配置
            $g.s.copySG('app', 'darkusable, darktype, darkmode')
            // 将 storage 数据覆盖回内存
            $g.s.copySG('user', '*')
            $g.s.copySG('userWX', '*')
        }
        this.globalData.app.DEBUG = false
        if (this.globalData.systemInfo.brand === 'devtools') {
            this.globalData.app.DEBUG = true
        }
        if ($g.hasKey(this.globalData.systemInfo, 'enableDebug')) {
            const s: any = this.globalData.systemInfo
            if (s.enableDebug) {
                this.globalData.app.DEBUG = true
            }
        }
        // 检查数据
        $g.log('[App.globalData]', this.globalData)
        $g.log('[App.Storage]', $g.s.storageAll())
        $g.s.storageInfo()
        // 输出文件夹下的整体情况
        WXFile.checkFileList('', true)
        // 登录
        WXUser.wxCode()
        // 获取用户信息
        WXUser.wxGetSetting()
        // 获取生物认证状况
        WXSoterAuth.checkSupport()

        // wx.getUpdateManager 在 1.9.90 才可用，请注意兼容
        const updateManager = wx.getUpdateManager()
        updateManager.onCheckForUpdate(function (res) {
            // 请求完新版本信息的回调
            $g.log('onCheckForUpdate : ', res.hasUpdate)
        })
        updateManager.onUpdateReady(function () {
            wx.showModal({
                title: '更新提示',
                content: '新版本已经准备好，是否马上重启小程序？',
                success: function (res) {
                    if (res.confirm) {
                        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                        updateManager.applyUpdate()
                    }
                }
            })
        })
        updateManager.onUpdateFailed(function () {
            $g.log('onUpdateFailed : 新的版本下载失败')
        })
    },
})