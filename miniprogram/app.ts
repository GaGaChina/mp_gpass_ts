import { $g } from "./frame/speed.do";
import { WXSoterAuth } from "./frame/wx/wx.soter.auth";
import { WXUser } from "./frame/wx/wx.user"
import { WXSize } from "./frame/wx/wx.resize"
import { GDataLib } from "./lib/g-data-lib/g.data.lib";

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
        glib: new GDataLib(),
        db: null,
    },
    onLaunch() {
        $g.init(this)
        WXSize.init()
        // 版本升级需要维护本地缓存数据
        if ($g.data.getS('app.ver') !== this.globalData.app.ver) {
            $g.log('版本升级 : ' + this.globalData.app.ver + ' → ' + $g.data.getS('app.ver'))
            //获取需要保存的数据
            $g.data.saveSG('user', '*,!id,!wx,!wxEncryptedData,!wxSignature,!wxIv,!wxCode,!promoter');
            //清理服务器数据
            $g.data.storageClear();
            //创建保存数据,进行保存
            $g.data.saveGS('app', 'ver');
            $g.data.saveGS('user', '*');
            $g.data.saveGS('userWX', '*');
            const glib = $g.data.storageGet('glib')
            if (glib) this.globalData.glib.setInfo(glib)
        }
        $g.data.saveGS('app', '*,!appVer');
        $g.data.saveSG('user', '*');
        $g.data.saveSG('userWX', '*');
        $g.data.storageInfo();
        // 登录
        WXUser.wxCode();
        // 获取用户信息
        WXUser.wxGetSetting()
        // 获取生物认证状况
        WXSoterAuth.checkSupport()
    },
})