import { NetBase } from "./base";
import { $g } from "../speed.do";
import { NetBaseItem } from "./base.item";

export class ApiUserPromoter extends NetBase {

    /** 连接的模式 */
    protected type: string = '推广员';
    /** 发送的连接地址 */
    protected url: string = '/MiniApps/miniAppActiveInfoRecord';
    /** 是否显示错误提示 */
    protected showToast: boolean = false;

    /**
     * 
     * @param data 不用填写,API填写完成
     * @param finish 完成时的回调
     * @param clear 是否清理完成函数
     */
    public async send(): Promise<NetBaseItem> {
        if ($g.a.globalData.user.promoter && $g.a.globalData.user.promoter.SendProm === false) {
            let data: any = {
                'user_id': $g.s.g.user.id,
            };
            await super.send(data);
            this.callBack();
        }
        let self: ApiUserPromoter = this;
        return new Promise(function (res, rej) {
            res(self.info);
        });
    }

    private callBack(): void {
        let isComplete: boolean = false;
        if (this.info.dataServer) {
            if ($g.getKeys(this.info, 'dataServer.data.code') && this.info.dataServer.data.code <= 2000) {
                isComplete = true;
            }
        }
        if (this.info.dataErrServer) {
            if ($g.getKeys(this.info, 'dataErrServer.data.code') && this.info.dataErrServer.data.code == 4000) {
                isComplete = true;
            }
        }
        if (isComplete && $g.a.globalData.user.promoter) {
            $g.a.globalData.user.promoter.SendProm = true;
            $g.s.copyGS('user')
        }
    }
}