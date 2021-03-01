import { $g } from "./frame/speed.do"
import { WXSoterAuth } from "./frame/wx/wx.soter.auth"
import { WXUser } from "./frame/wx/wx.user"
import { WXFile } from "./frame/wx/wx.file"
import { WXSize } from "./frame/wx/wx.resize"
import { DBLib } from "./lib/g-data-lib/db"
import { WXSystemInfo } from "./frame/wx/wx.system.info"
import { DBLibApi } from "./lib/g-data-lib/db.lib.api"

App<IAppOption>({
    globalData: {
        app: {
            urlApi: '',
            urlImg: '',
            urlCloudWX: 'cloud://gpass-1g8hyb9r0654b869.6770-gpass-1g8hyb9r0654b869-1301141054',
            id: 'wx98e663f2bb3467bd',
            ver: '1.4.0',
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
            id: '',
            openid: '',
            unionid: ''
        },
        dbLib: new DBLib(),
        dbItem: null,
        dbKdbx: null,
    },
    async onLaunch() {
        $g.init(this)
        WXSize.init()
        WXSize.getSize(this.globalData.systemInfo)
        // 获取 Storage 档案数据来设置内存
        const dbLib: DBLib = this.globalData.dbLib
        DBLibApi.storageRead(dbLib)
        await WXFile.rmDir('temp', true)
        await DBLibApi.check(dbLib)
        //dbLib.fileSizeRun()
        // 版本升级需要维护本地缓存数据
        const storageVer: any = $g.s.getS('app.ver')
        $g.log('版本 : ' + this.globalData.app.ver + ' → ' + storageVer)
        if (storageVer !== this.globalData.app.ver) {
            $g.log('数据版本升级')
            // 将 storage 数据拷贝到内存
            $g.s.copySG('user', '*,!id,!openid,!unionid,!wx,!wxEncryptedData,!wxSignature,!wxIv,!wxCode,!promoter')
            // 清理 storage 数据
            $g.s.storageClear()
            // 写回 storage 数据
            DBLibApi.storageSave(dbLib)
            $g.s.copyGS('app', 'ver')
            $g.s.copyGS('user', '*')
            $g.s.copyGS('userWX', '*')
        } else {
            DBLibApi.storageSave(dbLib)
            // 读取缓存中的配置
            $g.s.copySG('app', 'darkusable, darktype, darkmode')
            // 将 storage 数据覆盖回内存
            $g.s.copySG('user', '*')
            $g.s.copySG('userWX', '*')
        }
        this.globalData.app.DEBUG = false
        if (this.globalData.systemInfo.brand === 'devtools') {
            this.globalData.app.DEBUG = true
        } else if ($g.hasKey(this.globalData.systemInfo, 'enableDebug')) {
            const s: any = this.globalData.systemInfo
            if (s.enableDebug) this.globalData.app.DEBUG = true
        }
        // 检查数据
        $g.log('[App.globalData]', this.globalData)
        $g.log('[App.Storage]', $g.s.storageAll())
        $g.s.storageInfo()
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
        // 开启云开发
        wx.cloud.init({
            // 后续 API 调用的默认环境配置，传入字符串形式的环境 ID 可以指定所有服务的默认环境，传入对象可以分别指定各个服务的默认环境，见下方详细定义
            env: 'gpass-1g8hyb9r0654b869',
            traceUser: true
        })
        if (this.globalData.user.openid === '') {
            const wxBaseInfo: any = await wx.cloud.callFunction({ name: 'WXBaseInfo', data: {} })
            $g.log('[云函数][WXBaseInfo]返回', wxBaseInfo)
            if (wxBaseInfo && wxBaseInfo.result && wxBaseInfo.result.openid) {
                this.globalData.user.openid = wxBaseInfo.result.openid
                $g.s.copyGS('user', '*')
            }
        } else {
            $g.log('缓冲中用户OpenId:', this.globalData.user.openid)
        }
        // 如果是本人开发, 打开调试工具
        if (!this.globalData.app.DEBUG && this.globalData.user.openid === 'oZWLz5BH0ytWnrZpEa8KJxcKAmfU') {
            wx.setEnableDebug({ enableDebug: true })
            this.globalData.app.DEBUG = true
        }
        if (this.globalData.app.DEBUG) {
            // 输出文件夹下的整体情况
            WXSystemInfo.showLog(this.globalData.systemInfo)
            $g.log('文件系统状况:')
            WXFile.logFileList('', true)
        }
        // 操作云数据库
        // const db: DB.Database = wx.cloud.database()
        // const db_user_db: DB.CollectionReference = db.collection('test')//user_db
        // const db_user_db_query: DB.Query = db_user_db.where({ _openid: this.globalData.user.openid })
        // const db_user_db_res: DB.IQueryResult = await db_user_db_query.get()
        // // db_user_db_res.data 为数组 (里面是信息内容) getInfoCloud
        // $g.log('[云数据库]获取用户信息', db_user_db_res)
        // $g.log('[云库内容]', dbLib.getInfoCloud())
        // const test_cloud_db: DBLib = new DBLib()
        // test_cloud_db.setInfo(dbLib.getInfoCloud())
        // $g.log('[云库新建]', test_cloud_db)

        // const db_test_add: DB.IAddResult = await db_user_db.add({ data: dbLib.getInfo() })
        // selectId: 1614172637182
        // _id: "057f92a66038567c002f27ce3e5cecb0"
        // _openid: "oZWLz5BH0ytWnrZpEa8KJxcKAmfU"
        // [云数据库] {_id: "057f92a66038567c002f27ce3e5cecb0", errMsg: "collection.add:ok"}
        // $g.log('[云数据库]', db_test_add)
        // db_test_add._id

        // await wx.cloud.callFunction({
        //     name: 'WXBaseInfo',
        //     data: {}
        // }).then(res => {
        //     $g.log('[云函数][WXBaseInfo]成功', res)

        // }).catch(e => {
        //     $g.log('[云函数][WXBaseInfo]错误', e)
        // })


    },
})