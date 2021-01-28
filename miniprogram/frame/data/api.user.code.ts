import { NetBase } from "./base";
import { NetBaseItem } from "./base.item";

export class ApiUserCode extends NetBase {

    /** 连接的模式 */
    protected type: string = 'JYJ获取二维码';
    /** 发送的连接地址 */
    protected url: string = '/MiniApps/getMiniAppCode';
    /** 是否显示下载 */
    protected showLoading: boolean = true;

    /**
     * 获取微信二维码
     * @param data app_id, scene参数, width, page, user_id
     * @param finish 完成时的回调
     * @param clear 是否清理完成函数
     */
    public send(data?: any): Promise<NetBaseItem> {
        let self: ApiUserCode = this;
        let superSend:Function  = super.send;
        return new Promise(async function (resolve, reject) {
            if (data === void 0) {
                // 运行错误
                let o: any = {};
                o.data = {};
                o.data.code = 9999;
                o.data.info = '必须要传值';
                self.info.dataErrNet = o;
                reject(self.info);
                return;
            }
            resolve(await superSend(data));
        });
    }
}