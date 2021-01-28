import { ToolString } from "../tools/tool.string";

/**
 * 通过客户端路由来控制全部页面的访问
 * 
 * 1. 信息使用base64进行封装打包, 参数使用 : speed_go (可以更改)
 * 2. 第一个字母的行为类型, 如果第一个字母为xyz,abc,表示第二个字母皆为行为类型.
 * 3. ||为参数分隔符
 * 
 */
export class AppRouteManage {

    /** 跳转的连接地址, 全局地址, 可以更改 */
    private static readonly appKey: string = 'speed_go';

    


    public jump(base64: string): void {
        const go: string = ToolString.b64Decode(base64);
        const a: Array<string> = go.split('||');
        let doKey: string = '';
        let doData: string = '';
        for (const s of a) {
            doKey = s.substr(0, 1);
            if ('xyzabc'.indexOf(doKey) === -1) {
                doData = s.substr(1);
            } else {
                doKey = s.substr(0, 2);
                doData = s.substr(2);
            }
            //开始解析各种操作
            this.run(doKey, doData);
            //wx.switchTab 对于跳转到 tab bar 的页面，最好选择 wx.switchTab() ，它会先关闭所有非 tab bar 的页面。其次，也可以选择 wx.reLaunch() ，它也能实现从非 tab bar 跳转到 tab bar，或在 tab bar 间跳转，效果等同 wx.switchTab() 。使用其他跳转 API 来跳转到 tab bar，则会跳转失败。
            //wx.navigateBack 用于关闭当前页面，并返回上一页面或多级页面。开发者可通过 getCurrentPages() 获取当前的页面栈，决定需要返回几层。这个 API 需要填写的参数只有 delta，表示要返回的页面数。若 delta 的取值大于现有可返回页面数时，则返回到用户进入小程序的第一个页面。当不填写 delta 的值时，就默认其为 1（注意，默认并非取 0），即返回上一页面。
        }
    }

    private run(key: string, data: string): void {
        switch (key) {
            case 'xt':
                wx.navigateTo({ url: ToolString.b64Decode(data) });
                break;
            case 'xr':
                wx.redirectTo({ url: ToolString.b64Decode(data) });
                break;
            case 'xl':
                wx.reLaunch({ url: ToolString.b64Decode(data) });
                break;
            default:
                break;
        }
    }

    /** (页面少,最多10栈)保留当前页面、跳转到应用内的某个页面, wx.navigateBack可以返回到原页面 */
    public wx_navigateTo(url: string): string { return 'xt' + ToolString.b64Encode(url); }
    /** (5层页面栈)关闭当前页,跳转其他页被保留页面会挤占微信分配给小程序的内存 */
    public wx_redirectTo(url: string): string { return 'xr' + ToolString.b64Encode(url); }
    /** 关闭所有页面，打开到应用内的某个页面 */
    public wx_reLaunch(url: string): string { return 'xl' + ToolString.b64Encode(url); }

    /** 关闭当前页面，并返回上页或多级页面,getCurrentPages() 获取当前的页面栈 */
    public wx_navigateBack(delta?: number | undefined): string {
        if (delta === undefined) delta = 1;
        return 'u' + delta.toString();
    }


}