import { $g } from "../speed.do"

/**
 * 对象池 : 取出来用
 * 创建的有可能失败, 不知道什么原因
 */
export class DataCanvas {

    /** 叠加 ID */
    public static id: number = 0
    /** 创建 Canvas */
    public methodCreat: { (): Promise<DataCanvasItem | null> } | null = null
    /** 删除某id */
    public methodDel: { (id: number): Promise<any> } | null = null
    /** 设置尺寸 */
    public methodSetSize: { (canvas: WechatMiniprogram.Canvas, id: number, w: number, h: number): Promise<any> } | null = null

    /** 创建一个新的Canvas */
    public async getCanvas(): Promise<DataCanvasItem | null> {
        if (this.methodCreat !== null) {
            return await this.methodCreat()
        } else {
            return Promise.resolve(null)
        }
    }

    /** 自动运行回调函数 */
    public async del(id: number): Promise<any> {
        if (this.methodDel !== null) {
            return await this.methodDel(id)
        } else {
            return Promise.resolve()
        }
    }

    /**
     * 设置 ID 的宽和高
     * @param id 
     * @param w 
     * @param h 
     */
    public async setSize(canvas: WechatMiniprogram.Canvas, id: number, w: number, h: number): Promise<any> {
        if (this.methodSetSize !== null) {
            return await this.methodSetSize(canvas, id, w, h)
        } else {
            return Promise.resolve()
        }
    }
}

export class DataCanvasItem {

    /** Canvas 的 ID */
    public id: number = 0
    /** 在 DOM 里的 Id */
    public domId: string = ''
    /** 页面中临时使用的 Canvas 对象 */
    public canvas: WechatMiniprogram.Canvas | null = null
    /** 页面里的 CanvasContext */
    public ctx: WechatMiniprogram.CanvasContext | null = null
    /** 宽度 */
    public width: number = 0
    /** 宽度 */
    public height: number = 0

    // public getInfo(): Object {
    //     return {
    //         id: this.id,
    //         domId: this.domId,
    //         canvas: this.canvas,
    //         ctx: this.ctx,
    //         width: this.width,
    //         height: this.height
    //     }
    // }
}