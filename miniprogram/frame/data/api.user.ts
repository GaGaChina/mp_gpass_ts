import { NetBase } from "./base";
import { $g } from "../speed.do";
import { NetBaseItem } from "./base.item";

export class ApiUser extends NetBase {

    /** 连接的模式 */
    protected type: string = 'JYJ登录';
    /** 发送的连接地址 */
    protected url: string = '/Login/getWxLogin';
    /** 是否开启缓存 */
    protected startCache: boolean = false;
    /** 缓存的时间,30 秒内相同地址不会重复请求 */
    protected timeCache: number = 0;
    /** 虚拟数据 */
    protected dummyInfo: any = {};
    /** 虚拟数据是否启用 */
    protected dummyStart: boolean = false;

    /**
     * 
     * @param data 不用填写,API填写完成
     * @param finish 完成时的回调
     * @param clear 是否清理完成函数
     */
    public send(data?: any): Promise<NetBaseItem> {
        // 获取渠道id
        const promoterId: number = $g.a.globalData.user.promoter ? $g.a.globalData.user.promoter.id : 0;
        data = {
            'code': $g.a.globalData.user.wxCode,
            'encryptedData': $g.a.globalData.user.wxEncryptedData,
            'iv': $g.a.globalData.user.wxIv,
            'appid': $g.a.globalData.app.id,
            'extenduid': promoterId,
            'is_offline_mini_app': 6
        };
        return super.send(data);
    }

    /** 获取完数据处理 */
    protected showToastHandle(): void {
        this.log('继承类完成调用 : complete');
        if (this.info.dataServer) {
            const data: any = this.info.dataServer.data;
            $g.s.g.user.id = data.entity.uid.substr(6, data.entity.uid.length - 12);
            //是否是金英杰新用户
            let promoter: number = 0;
            if ($g.s.g.user.promoter) {
                promoter = $g.s.g.user.promoter.id;
            }
            if (Number(data.entity.is_new_user) > 0) {
                wx.reportAnalytics('user_is_new', {
                    promoter: promoter,
                    user_id: Number($g.s.g.user.id),
                });
            }
            this.log('金英杰用户ID : ' + $g.s.g.user.id);
            $g.s.copyGS('user', '*');
            $g.s.copyGS('userWX', '*');
        }
        super.showToastHandle();
    }

    /**
     * 包装一个虚拟数据
     */
    protected dummyMake(): any {
        let o: any = super.dummyMake();
        delete o.data.info;
        o.data.entity = {};
        o.data.entity.uid = "12345699123456";
        return o;
    }
}