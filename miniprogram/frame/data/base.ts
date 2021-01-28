import { ToolString } from "../tools/tool.string";
import { $g } from "../speed.do";
import { NetBaseItem } from "./base.item";

/**
 * 统一网络请求
 * 1. 支持设置缓存,防止DDOS服务器,自动管理缓存内容
 * 2. 支持自动重试
 * 3. 提供统一的错误处理机制, 减少代码冗余
 * 4. 提供统一的日志处理
 * 5. 提供模拟数据
 * 
 */
export class NetBase {

    /** 发送的缓存数据 */
    public static lib: Array<NetBaseItem> = new Array<NetBaseItem>();
    /** 是否开启缓存 */
    public static libStart: boolean = false;
    /** 是否开启日志 */
    public static startLog: boolean = true;
    /** 消息的ID序列号 */
    private static _id: number = 0;

    /** 消息序列ID号 */
    protected id: number = 0;
    /** 连接的模式 */
    protected type: string = 'HTTP请求';
    /** 消息内容 */
    protected info!: NetBaseItem;
    /** 虚拟数据 */
    protected dummyInfo?: Object;
    /** 虚拟数据是否启用 */
    protected dummyStart: boolean = false;
    /** 发送的连接地址 */
    protected url: string = '/MiniApps/miniAppActiveInfoRecord';
    /** 连接模式 */
    protected method?: 'POST' | 'OPTIONS' | 'GET' | 'HEAD' | 'PUT' | 'DELETE' | 'TRACE' | 'CONNECT' | undefined = 'POST';
    /** 连接头 */
    protected header?: Record<string, any> = { 'content-type': 'application/x-www-form-urlencoded' };
    /** 是否开启缓存 */
    protected startCache: boolean = false;
    /** 缓存的时间,30 秒内相同地址不会重复请求 */
    protected timeCache: number = 30 * 1000;
    /** 可以重复发送次数 */
    protected reSendTime: number = 2;
    /** 已经重复次数 */
    protected reSendTimeT: number = 0;
    /** 是否显示错误提示 */
    protected showToast: boolean = true;
    /** 是否显示下载 */
    protected showLoading: boolean = false;

    /**
     * 设置要发送的信息, 并发送, 异步返回结果
     * @param data 发送的内容
     */
    public send(data?: any): Promise<NetBaseItem> {
        let self: NetBase = this;
        return new Promise(async (resolve, reject) => {
            self.id = NetBase._id++;
            self.log('启动 API URL : ' + self.url);
            self.info = new NetBaseItem();
            self.info.timeCreate = new Date().getTime();
            self.info.id = self.id;
            self.info.name = self.type;
            try {
                // 是否直接返回虚拟数据
                if (self.dummyStart) {
                    self.log('启用本地虚拟数据');
                    self.dummyRun();
                    resolve(self.info)
                    return;
                } else {
                    // 查询是否有旧的
                    if (NetBase.libStart && self.startCache) {
                        self.log('提取缓存数据');
                        self.log('CRC32 ' + ToolString.CRC32_Str(JSON.stringify(data)));
                    }
                    self.info.dataSend = data;
                    if (NetBase.libStart && self.startCache) NetBase.lib.push(self.info);
                    let sendBack: NetBaseItem = await self.sendPromoter();
                    // 用异步方法好像无法达到这个效果~ 可能要在封装一层
                    if (self.info.dataErrNet && self.reSendTimeT < self.reSendTime) {
                        self.log('自动重试 : ' + self.reSendTimeT);
                        self.info.dataErrNet = null;
                        sendBack = await self.sendPromoter();
                    }
                    resolve(sendBack);
                }
            } catch (e) {
                // 运行错误
                let o: any = {};
                o.data = {};
                o.data.code = 9999;
                o.data.info = e;
                self.info.dataErrNet = o;
                reject(self.info);
            }
        });
        // 清理NetBase.lib...
    }

    /**
     * 发送推广人信息
     * @param id 类型的ID号
     */
    protected sendPromoter(): Promise<NetBaseItem> {
        let self: NetBase = this;
        return new Promise(function (resolve, reject) {
            if (self.showLoading) wx.showLoading({ title: '加载中' });
            self.info.timeSend = new Date().getTime();
            self.log('传输 Data:');
            self.log(self.info.dataSend);
            wx.request({
                url: $g.s.g.app.urlApi + self.url,
                data: self.info.dataSend,
                method: self.method,
                header: self.header,
                complete: function (res: any): void {
                    if (self.showLoading) wx.hideLoading();
                    self.info.timeComplete = new Date().getTime();
                    self.log('获取数据成功 : ' + self.type);
                    self.log(res);
                    if ($g.hasKeys(res, 'data.code')) {
                        let code: number = Number(res.data.code);
                        res.data.code = code;
                        if (code <= 2000) {
                            self.info.dataServer = res;
                        } else {
                            self.info.dataErrServer = res;
                        }
                    } else {
                        self.info.dataErrServer = res;
                    }
                    self.showToastHandle();
                    resolve(self.info);
                },
                fail: function (res: any): void {
                    if (self.showLoading) wx.hideLoading();
                    self.info.timeComplete = new Date().getTime();
                    self.log('连接失败 : ' + self.type);
                    self.log(res);
                    self.reSendTimeT++;
                    self.info.dataErrNet = res;
                    self.showToastHandle();
                    reject(self.info);
                }
            });
        });
    }

    /** 获取完数据处理 */
    protected showToastHandle(): void {
        if (this.info.dataErrNet) {
            if (this.showToast) {
                wx.showToast({
                    title: '服务器连接失败 : ' + this.type,
                    icon: 'none',
                    duration: 2000
                });
            }
        } else if (this.info.dataErrServer) {
            if (this.showToast) {
                wx.showToast({
                    title: '未获得数据 : ' + this.type,
                    icon: 'none',
                    duration: 2000
                });
            }
        }
    }

    /**
     * 执行模拟数据
     */
    protected dummyRun(): any {
        this.info.dataServer = this.dummyMake();
        this.showToastHandle();
    }

    /**
     * 包装一个虚拟数据
     */
    protected dummyMake(): any {
        let o: any = {};
        o.data = {};
        o.data.code = this.dummyInfo ? 2000 : 9999;
        if (this.dummyInfo) o.data.info = this.dummyInfo;
        return o;
    }

    /**
     * 判断对象格式, 自动输出合适的内容
     * @param args 日志内容
     */
    protected log(...args: any[]): void {
        if (NetBase.startLog) {
            if (args.length === 1 && $g.isBase(args[0])) {
                let o: string = '[NET][' + ToolString.getNumberStr(this.id) + ']';
                o += '[' + this.type + ']';
                $g.log(o + args[0].toString());
            } else {
                $g.log(...args);
            }
        }
    }
}
