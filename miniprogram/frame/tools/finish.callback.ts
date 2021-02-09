import { $g } from "../speed.do";

export class CallBackFunc {

    /** 回调函数库 */
    private _lib: Array<Function> = new Array<Function>();

    constructor(finish?: Function | undefined) {
        if ($g.isFunction(finish)) {
            const f: any = finish
            this._lib.push(f);
        }
    }

    /** 遍历完成函数 */
    public complete(...rest: any[]): void {
        if (this._lib.length) {
            let list: Array<Function> = this._lib.slice();
            this.clear();
            list.forEach(item => {
                item(rest);
            });
        }
    }

    /**
     * 添加执行函数
     * @param finish 回调函数
     * @param clear 是否清理
     */
    public add(finish?: Function | undefined, clear: boolean = true): void {
        if (clear) this.clear();
        if ($g.isFunction(finish)) {
            const f: any = finish
            this._lib.push(f);
        }
    }

    /**
     * 清空
     */
    public clear(): void {
        this._lib.length = 0;
    }
}