import { DataCanvasItem } from "../data/data.canvas"
import { $g } from "../speed.do"
import { WXFile } from "./wx.file"

export class WXImage {

    /**
     * 获取图片信息
     * width(px), height(px), path(string)
     * https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.getImageInfo.html
     * @param src 图片的路径，支持网络路径、本地路径、代码包路径
     */
    public static getImageInfo(src: string): Promise<WechatMiniprogram.GetImageInfoSuccessCallbackResult | null> {
        return new Promise(resolve => {
            wx.getImageInfo({
                src: src,
                success(res: WechatMiniprogram.GetImageInfoSuccessCallbackResult) {
                    // $g.g.app.DEBUG && $g.log('[WXImage.ImageInfo]成功', res)
                    return resolve(res)
                },
                fail(e: WechatMiniprogram.GeneralCallbackResult) {
                    $g.g.app.DEBUG && $g.log('[WXImage.ImageInfo]错误', src, e)
                    return resolve(null)
                }
            })
        })
    }


    // let copyImg: string = wx.env.USER_DATA_PATH + '/temp.png'
    // // let copyImg: string = '/img/logo.png'
    // const imgInfo: WechatMiniprogram.GetImageInfoSuccessCallbackResult | null = await WXImage.getImageInfo(copyImg)
    // if (imgInfo) {
    //     $g.log('开始创建缩略图', imgInfo)
    //     const tempPathMin: string = await WXImage.imgScaleIn(copyImg, imgInfo.width, imgInfo.height, 750, $g.g.app.scene.winHeight)
    //     // const tempPathMin: string = await WXImage.imgScaleIn(imgInfo.path, imgInfo.width, imgInfo.height, 120, 120)
    //     $g.log('创建缩略图:', tempPathMin)
    //     if (tempPathMin) {
    //         const byteMin: any = await WXFile.readFile(tempPathMin, undefined, undefined, undefined, false)
    //         $g.log('缩略图文件:', byteMin)
    //         if (byteMin) {
    //             const tempPath: string = wx.env.USER_DATA_PATH + '/temp_new.png'
    //             await WXFile.writeFile(tempPath + '.min', byteMin, 0, 'binary')
    //         }
    //     }
    // }

    /**
     * 对图片进行缩放
     * - 'up': 默认方向（手机横持拍照），对应 Exif 中的 1。或无 orientation 信息。;
     * - 'up-mirrored': 同 up，但镜像翻转，对应 Exif 中的 2;
     * - 'down': 旋转180度，对应 Exif 中的 3;
     * - 'down-mirrored': 同 down，但镜像翻转，对应 Exif 中的 4;
     * - 'left-mirrored': 同 left，但镜像翻转，对应 Exif 中的 5;
     * - 'right': 顺时针旋转90度，对应 Exif 中的 6;
     * - 'right-mirrored': 同 right，但镜像翻转，对应 Exif 中的 7;
     * - 'left': 逆时针旋转90度，对应 Exif 中的 8;
     * 
     * @param source 要加 wx.env.USER_DATA_PATH, 所要绘制的图片资源（网络图片要通过 getImageInfo / downloadFile 先下载）, 
     * @param sourceWidth 原始图片的尺寸
     * @param sourceHeight 原始图片的尺寸
     * @param sourceAngle 原始图片是否需要被旋转
     * @param changeWidth 修改后的尺寸
     * @param changeHeight 修改后的尺寸
     * @param orientation 图片拍摄的情况, 会影响图片的宽高
     */
    public static imgScaleIn(source: string, sourceWidth: number, sourceHeight: number, changeWidth: number, changeHeight: number, orientation: "up" | "up-mirrored" | "down" | "down-mirrored" | "left-mirrored" | "right" | "right-mirrored" | "left" | "" = ''): Promise<any> {
        return new Promise(async function (resolve) {
            changeWidth = ~~(changeWidth)
            changeHeight = ~~(changeHeight)
            // let sourceAngle: number = 0
            // let mirrored: boolean = false
            // 是否颠倒 width height
            // let changeWH: boolean = false
            // switch (orientation) {
            //     case 'up':
            //     case 'down':
            //         sourceAngle = sourceWidth
            //         sourceWidth = sourceHeight
            //         sourceHeight = sourceAngle
            //         sourceAngle = 270
            //         changeWH = true
            //         break;
            //     case 'up-mirrored':
            //     case 'down-mirrored':
            //         sourceAngle = sourceWidth
            //         sourceWidth = sourceHeight
            //         sourceHeight = sourceAngle
            //         sourceAngle = 90
            //         mirrored = true
            //         changeWH = true
            //         break;
            //     case 'left':
            //     case 'right':
            //         break;
            //     case 'left-mirrored':
            //     case 'right-mirrored':
            //         mirrored = true
            //         break;
            // }
            if (sourceWidth > changeWidth || sourceHeight > changeHeight || sourceWidth > changeHeight || sourceHeight > changeWidth) {
                // $g.log('WXImage.imgScaleIn')
                const canvasItem: DataCanvasItem | null = await $g.canvas.getCanvas()
                // $g.log('获取 Canvas : ', canvasItem)
                if (canvasItem && canvasItem.canvas && canvasItem.ctx) {
                    const canvas: WechatMiniprogram.Canvas = canvasItem.canvas
                    const ctx: WechatMiniprogram.CanvasContext = canvasItem.ctx
                    // 测试另一种写法 : 不行 不支持 2d → 所以无法
                    // let canvas: any = wx.createOffscreenCanvas()
                    // 创建 canvas 当前仅支持获取 WebGL 绘图上下文
                    // let ctx: any = canvas.getContext('2d')
                    // ctx.clearRect(0, 0, canvas.width, canvas.height)
                    let cvWidth: number = sourceWidth
                    let cvHeight: number = sourceHeight
                    if (cvWidth > changeWidth) {
                        cvWidth = changeWidth
                        cvHeight = ~~(cvWidth / sourceWidth * sourceHeight)
                    }
                    if (cvHeight > changeHeight) {
                        cvHeight = changeHeight
                        cvWidth = ~~(cvHeight / sourceHeight * sourceWidth)
                    }
                    // $g.log('[WXImage]尺寸', sourceWidth, sourceHeight, cvWidth, cvHeight)
                    // $g.log('[WXImage]', orientation, sourceAngle)
                    await $g.canvas.setSize(canvas, canvasItem.id, cvWidth, cvHeight)
                    // $g.log('[WXImage][imgScaleIn]:', source, canvas, ctx)
                    // 需要这样
                    let image: any = canvas.createImage()
                    image.onload = async () => {
                        $g.g.app.DEBUG && $g.log('[WXImage.ScaleIn]载入绘制图片成功', image, image.width, image.height)
                        // 翻转
                        if (sourceWidth !== sourceHeight && (sourceWidth !== image.width || sourceHeight !== image.height)) {
                            sourceWidth = image.width
                            sourceHeight = image.height
                            // 重新计算
                            cvWidth = sourceWidth
                            cvHeight = sourceHeight
                            if (cvWidth > changeWidth) {
                                cvWidth = changeWidth
                                cvHeight = ~~(cvWidth / sourceWidth * sourceHeight)
                            }
                            if (cvHeight > changeHeight) {
                                cvHeight = changeHeight
                                cvWidth = ~~(cvHeight / sourceHeight * sourceWidth)
                            }
                            await $g.canvas.setSize(canvas, canvasItem.id, cvWidth, cvHeight)
                        }

                        // 三个版本写法
                        // drawImage(imageResource, dx, dy)
                        // drawImage(imageResource, dx, dy, dWidth, dHeight)
                        // drawImage(imageResource, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) 从 1.9.0 起支持
                        ctx.drawImage(image, 0, 0, sourceWidth, sourceHeight, 0, 0, cvWidth, cvHeight)

                        // if (sourceAngle) {
                        //     let moveXY: number = (cvWidth - cvHeight) / 2 + cvHeight / 2
                        //     // 绘制到偏移点
                        //     ctx.drawImage(image, 0, 0, sourceHeight, sourceWidth, 0, 0, cvHeight, cvWidth)
                        //     // 移动到中心点
                        //     ctx.translate(0, 0)
                        //     ctx.rotate(sourceAngle * Math.PI / 180)
                        //     if (mirrored) {
                        //         // 需要移动原点
                        //         ctx.translate(0, 0)
                        //         ctx.scale(-1, 1)
                        //     }
                        // } else {
                        //     ctx.drawImage(image, 0, 0, sourceWidth, sourceHeight, 0, 0, cvWidth, cvHeight)
                        //     if (mirrored) {
                        //         // 需要移动原点
                        //         ctx.translate(sourceWidth / 2, sourceHeight / 2)
                        //         ctx.scale(-1, 1)
                        //     }
                        // }
                        // --------------------------------------------- 直接调用 canvasToTempFilePath
                        // $g.log('[WXImage][imgScaleIn]直接canvasToTempFilePath')
                        wx.canvasToTempFilePath({
                            canvas: canvas,
                            quality: 1,
                            x: 0, y: 0,
                            width: cvWidth, height: cvHeight,
                            destWidth: cvWidth, destHeight: cvHeight,
                            async success(res: any) {
                                // $g.log('[WXImage][imgScaleIn]canvasToTempFilePath', res)
                                let tempFilePath: string = res.tempFilePath
                                $g.canvas.del(canvasItem.id)
                                if ($g.g.app.DEBUG) {
                                    $g.log('[WXImage.ScaleIn]创建图片文件', await WXFile.getFileStat(tempFilePath, false))
                                    $g.log('[WXImage.ScaleIn]创建图片信息', await WXImage.getImageInfo(tempFilePath))
                                }
                                return resolve(tempFilePath)
                            },
                            fail(e: any) {
                                $g.g.app.DEBUG && $g.log('[WXImage.ScaleIn]创建图片失败', e)
                                $g.canvas.del(canvasItem.id)
                                return resolve('')
                            }
                        })
                    }
                    image.onerror = (e: any) => {
                        $g.g.app.DEBUG && $g.log('[WXImage.ScaleIn]载入文件失败 : ', source, e)
                        $g.canvas.del(canvasItem.id)
                        return resolve('')
                    }
                    image.src = source
                } else {
                    if (canvasItem) $g.canvas.del(canvasItem.id)
                    $g.g.app.DEBUG && $g.log('[WXImage.ScaleIn]未获取到 Canvas')
                    return resolve('')
                }
            } else {
                // $g.log('[WXImage][imgScaleIn]无需缩放')
                return resolve('')
            }
            // ---------------------------------------------使用 createIamge 的方法, 失败, 说没这个方法
            // $g.log('[WXImage][imgScaleIn]createIamge')
            // const image: any = $g.canvas.canvas.createIamge()
            // image.onload = () => {
            //     $g.log('[createIamge][onload]', image)
            //     resolve(image)
            // }
            // image.onerror = () => {
            //     $g.log('[createIamge][onerror]')
            //     resolve('')
            // }

            // $g.log('[WXImage][imgScaleIn]draw')
            // ctx.draw()
            // -------------------------------------------------------方式 draw 然后在参数里调用 wx.canvasToTempFilePath(
            // ctx.draw(false, () => {
            //     $g.log('[WXImage][imgScaleIn]draw 完毕')
            //     const obj: any = {
            //         quality: 1,
            //         // canvasId: 'photo_canvas',
            //         success(res: any) {
            //             $g.log('[WXImage][imgScaleIn]canvasToTempFilePath', res)
            //             let tempFilePath: string = res.tempFilePath
            //             return resolve(tempFilePath)
            //         },
            //         fail(e: any) {
            //             $g.log('[WXImage][imgScaleIn]', e)
            //             return resolve('')
            //         }
            //     }
            //     const ctxAny: any = ctx
            //     if ($g.canvas.canvas) {
            //         obj.canvas = $g.canvas.canvas
            //     } else {
            //         obj.canvasId = 'wx_image'
            //         // obj.canvasId = ctxAny._id
            //     }
            //     wx.canvasToTempFilePath(obj)
            // })
            // -------------------------------------------------------方式
            // canvas: canvas,
            // setTimeout(() => {
            //     $g.log('[WXImage][imgScaleIn]延时执行')
            //     const obj: any = {
            //         quality: 1,
            //         // canvasId: 'photo_canvas',
            //         success(res: any) {
            //             $g.log('[WXImage][imgScaleIn]canvasToTempFilePath', res)
            //             let tempFilePath: string = res.tempFilePath
            //             return resolve(tempFilePath)
            //         },
            //         fail(e: any) {
            //             $g.log('[WXImage][imgScaleIn]', e)
            //             return resolve('')
            //         }
            //     }
            //     const ctxAny: any = ctx
            //     if ($g.canvas.canvas) {
            //         obj.canvas = $g.canvas.canvas
            //     } else {
            //         // obj.canvasId = 'wx_image'
            //         obj.canvasId = ctxAny._id
            //     }
            //     wx.canvasToTempFilePath(obj)
            // }, 1000)
        })
    }
}