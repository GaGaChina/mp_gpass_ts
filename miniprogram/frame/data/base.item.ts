export class NetBaseItem {
    /** 消息的ID号 */
    public id: number = 0;
    /** 消息的名称 */
    public name: string = '';
    /** 发出的内容 */
    public dataSend?: any;
    /** 服务器返回成功的信息 */
    public dataServer?: any;
    /** 服务器的错误提示 */
    public dataErrServer?: any;
    /** 消息发生网络错误的时候消息 */
    public dataErrNet?: any;
    /** 消息的创建时间 */
    public timeCreate?: number;
    /** 消息发出时间 */
    public timeSend?: number;
    /** 消息收到时间 */
    public timeComplete?: number;
}