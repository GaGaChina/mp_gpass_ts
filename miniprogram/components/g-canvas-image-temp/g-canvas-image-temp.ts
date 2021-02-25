import { DataCanvas, DataCanvasItem } from "../../frame/data/data.canvas"
import { $g } from "../../frame/speed.do"

/**
 * 组件 : g-canvas-image-temp
 * 信息放到 GData 中
 * 图片处理器内嵌组件
 *     处理一些图像
 *      {icon:string, title:string, note:string}
 */
Component({
    options: {
        styleIsolation: 'isolated',
    },
    /** 组件的内部数据 */
    data: {
        list: new Array<Object>()
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        /** 实例进入页面节点树时执行),可以setData */
        attached() {
            // $g.log('[组件][g-canvas-image-temp]')
        },
    },
    /** 组件所在页面的生命周期函数 */
    pageLifetimes: {
        /** 所在的页面被展示时执行 */
        show() {
            // $g.log('[g-canvas-image-temp]show')
            // this.setInfo()
            $g.canvas.methodCreat = this.creat.bind(this)
            $g.canvas.methodDel = this.del.bind(this)
            $g.canvas.methodSetSize = this.setSize.bind(this)
        }
    },
    /** 组件的方法列表 */
    methods: {
        creat(): Promise<DataCanvasItem | null> {
            const that = this
            return new Promise(async resolve => {
                const item: DataCanvasItem = new DataCanvasItem()
                DataCanvas.id = DataCanvas.id + 1
                item.id = DataCanvas.id
                item.width = 300
                item.height = 300
                item.domId = 'wx_image_' + DataCanvas.id.toString()

                const info: Object = {
                    id: item.id,
                    domId: item.domId,
                    width: item.width,
                    height: item.height
                }

                this.data.list.push(info)
                this.setData({ list: this.data.list }, async () => {
                    await that.selectCanvas(item)
                    return resolve(item)
                })
            })
        },
        del(id: number): Promise<any> {
            return new Promise(async resolve => {
                let has: boolean = false
                for (let i = 0; i < this.data.list.length; i++) {
                    const info: any = this.data.list[i]
                    if (info.id === id) {
                        has = true
                        this.data.list.splice(i, 1)
                        this.setData({ list: this.data.list }, () => {
                            return resolve()
                        })
                        break;
                    }
                }
                if (has === false) {
                    return resolve()
                }
            })
        },
        /** 封装 Promise 的设置 */
        setSize(canvas: WechatMiniprogram.Canvas, id: number, w: number, h: number): Promise<any> {
            return new Promise(resolve => {
                // width = width * $g.g.systemInfo.pixelRatio
                // height = height * $g.g.systemInfo.pixelRatio
                let has: boolean = false
                for (let i = 0; i < this.data.list.length; i++) {
                    const info: any = this.data.list[i]
                    if (info.id === id) {
                        has = true
                        if (info.width !== w && info.height !== h) {
                            // $g.log('[g-canvas-image-temp]w:', w, ' h:', h)
                            const canvasAny: any = canvas
                            canvasAny.width = w
                            canvasAny.height = h
                            info.width = w
                            info.height = h
                            this.setData({ list: this.data.list }, () => {
                                return resolve()
                            })
                        } else {
                            return resolve()
                        }
                        break;
                    }
                }
                if (has === false) {
                    return resolve()
                }
            })
        },
        /** 查询出 canvas 并设置进入 DataCanvas */
        selectCanvas(item: DataCanvasItem): Promise<any> {
            return new Promise(resolve => {
                // 自定义组件使用 this.createSelectorQuery wx.createSelectorQuery
                const query: WechatMiniprogram.SelectorQuery = this.createSelectorQuery()
                const select: WechatMiniprogram.NodesRef = query.select('#' + item.domId)
                select.fields({ // 需要获取的节点相关信息
                    node: true, // 是否返回节点对应的 Node 实例
                    size: true // 是否返回节点尺寸（width height）
                }).exec((res) => {
                    // $g.log('[g-canvas-image-temp][select]', res)
                    let canvas: any = null
                    let ctx: any = null
                    if (res && res.length) {
                        // width height
                        const o = res[0]
                        if ($g.hasKey(o, 'node') && o.node) {
                            canvas = o.node
                        }
                    }
                    if (canvas) {
                        ctx = canvas.getContext('2d')
                        // ctx.scale($g.g.systemInfo.pixelRatio, $g.g.systemInfo.pixelRatio)
                    }
                    if (ctx === null) {
                        ctx = wx.createCanvasContext(item.domId, this)
                        // $g.log('[g-canvas-image-temp][setGImage]强制创建 ctx : ', ctx)
                    } else {
                        // $g.log('[g-canvas-image-temp][setGImage] ctx : ', ctx)
                    }
                    // const gl = canvas.getContext('webgl')

                    // canvas.width = this.data.width * $g.g.systemInfo.pixelRatio
                    // canvas.height = this.data.height * $g.g.systemInfo.pixelRatio
                    // ctx.scale($g.g.systemInfo.pixelRatio, $g.g.systemInfo.pixelRatio)

                    item.canvas = canvas
                    item.ctx = ctx
                    return resolve()
                });
            })
        },
    },
})
