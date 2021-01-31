import { $g } from "./frame/speed.do"
import { WXSoterAuth } from "./frame/wx/wx.soter.auth"
import { WXUser } from "./frame/wx/wx.user"
import { WXFile } from "./frame/wx/wx.file"
import { WXSize } from "./frame/wx/wx.resize"
import { DBLib } from "./lib/g-data-lib/db"
// import { DBLib } from "./lib/g-data-lib/db.lib"

App<IAppOption>({
    globalData: {
        app: {
            urlApi: '',
            urlImg: '',
            id: '',
            ver: '0.0.1',
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
        },
        user: {
            id: ''
        },
        dbLib: new DBLib(),
    },
    onLaunch() {
        $g.init(this)
        WXSize.init()
        // 获取 Storage 的数据来设置
        const dbLib:DBLib = this.globalData.dbLib
        dbLib.storageSetThis()
        dbLib.checkFile()
        dbLib.fileSizeRun()
        // 版本升级需要维护本地缓存数据
        $g.log('版本检查 : ' + this.globalData.app.ver + ' → ' + $g.s.getS('app.ver'))
        if ($g.s.getS('app.ver') !== this.globalData.app.ver) {
            $g.log('数据版本升级!')
            // 获取需要保存的数据
            $g.s.copySG('user', '*,!id,!wx,!wxEncryptedData,!wxSignature,!wxIv,!wxCode,!promoter');
            //清理服务器数据
            $g.s.storageClear()
            //创建保存数据,进行保存
            dbLib.storageSaveThis()
            $g.s.copyGS('app', 'ver')
            $g.s.copyGS('user', '*')
            $g.s.copyGS('userWX', '*')
            $g.s.copyGS('dbInfo', '*')
        }
        // 读取 app 中 除了 appVer 的内容
        $g.s.copyGS('app', '*,!appVer')
        // 获取缓存的用户数据
        $g.s.copySG('user', '*')
        $g.s.copySG('userWX', '*')
        // 检查数据
        $g.log('[App.globalData]', this.globalData)
        $g.log('[App.Storage]', $g.s.storageAll())
        $g.s.storageInfo()
        WXFile.checkFileList('', true)
        // 登录
        WXUser.wxCode()
        // 获取用户信息
        WXUser.wxGetSetting()
        // 获取生物认证状况
        WXSoterAuth.checkSupport()
    },
})