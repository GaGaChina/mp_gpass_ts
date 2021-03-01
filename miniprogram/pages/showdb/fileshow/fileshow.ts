import { $g } from "../../../frame/speed.do"
import { DBItem, DBLib } from "../../../lib/g-data-lib/db"
import { Entry } from "../../../lib/kdbxweb/types"
import { WXFile } from "../../../frame/wx/wx.file"
import { DBEntryApi } from "../../../lib/g-data-lib/db.entry.api"

Page({
    data: {
        fullPageHeight: 0,
        /** 台头显示的标题 */
        pagetitle: '文件展示',
        /** 本页展示的UUID对象 */
        // uuid: '',
        /** 文件 */
        pathHead: '',
        /** 文件列表 */
        fileList: new Array<Object>(),
        /** 现在的index */
        swiperIndex: 0,
        /** 0正常 1迷你 */
        imgSize: 0,
    },
    onLoad(query: any) {
        const scene: DataScene = $g.g.app.scene
        const fullHeight: number = scene.winHeight - scene.topBarHeight - scene.topBarTop
        this.setData({
            fullPageHeight: fullHeight,
        })
        $g.log('onLoad GET : ', query);
        this.data.imgSize = 0
        if ($g.hasKey(query, 'size') && Number(query.size) === 1) {
            this.data.imgSize = 1
        }
        if ($g.hasKey(query, 'index')) {
            this.data.swiperIndex = Number(query.index)
        }
        // if ($g.hasKey(query, 'uuid')) {
        //     this.data.uuid = String(query.uuid)
        //     let length = this.data.uuid.length % 4
        //     if (length > 0) {
        //         while (++length < 5) {
        //             this.data.uuid += '='
        //         }
        //     }
        // }
        const dbLib: DBLib = $g.g.dbLib
        const select: any = dbLib.selectItem
        const dbItem: DBItem = select
        if (select === null || dbItem.db === null || dbItem.selectEntry === null) {
            this.pageBack()
            return
        }
        let pathUUID: string | undefined = dbItem.selectEntry.uuid.id
        if (pathUUID) {
            pathUUID = pathUUID.split('=').join('')
        } else {
            $g.log('未获取到uuid')
            this.pageBack()
            return
        }
        this.data.pathHead = `db/${dbItem.path}/${pathUUID}.`
        this.setInfo(dbItem, dbItem.selectEntry)
    },
    pageBack() {
        const cps: any = getCurrentPages()
        if (cps.length > 1) {
            wx.navigateBack()
        } else {
            wx.reLaunch({ url: '/pages/index/index' })
        }
    },
    async setInfo(dbItem: DBItem, entry: Entry) {
        // 首先获取 gkv
        var gkv: any;
        if (entry && $g.hasKey(entry.fields, 'GKeyValue')) {
            const gkvJSON: any = entry.fields['GKeyValue']
            gkv = JSON.parse(gkvJSON)
        } else {
            gkv = {}
        }
        // -------------------------- 添加附件 ( 需要将二进制保存到本地进行 Canvas )
        const fileList: Array<Object> = this.data.fileList
        fileList.length = 0
        // -------------------------- 文件内的 binaries
        // const binaries: any = entry.binaries
        // const fileKeyList: Array<string> = Object.keys(binaries)
        // for (let i = 0; i < fileKeyList.length; i++) {
        //     const fileName: string = fileKeyList[i]
        //     const fileInfo: any = binaries[fileName]
        //     let byte: ArrayBuffer = fileInfo.value
        //     const fileItem: object = {
        //         name: fileName,
        //         ref: fileInfo.ref,
        //         pass: '',
        //         size: byte.byteLength,
        //         savetype: 'binaries',
        //         base64: 'data:image/png;base64,' + ToolBytes.ArrayBufferToBase64(byte),
        //     }
        //     fileList.push(fileItem)
        // }
        // --------------------------添加 GKeyValue 的文件
        if ($g.hasKey(gkv, 'filelist')) {
            const gkvFileList: [] = gkv['filelist']
            for (let i = 0; i < gkvFileList.length; i++) {
                const item: any = gkvFileList[i]
                let itemPath: string = ''
                let extend: string = ''
                const nameArray: Array<string> = item.name.split('.')
                if (nameArray.length > 1) extend = nameArray[nameArray.length - 1].toLocaleLowerCase()
                let path: string = 'temp/' + item.ref
                if (this.data.imgSize === 1) {
                    // 需要检查宽度以及文件
                    path += '.min.png'
                } else {
                    if (extend.length) path += '.' + extend
                }
                let check: WechatMiniprogram.Stats | null = await WXFile.getFileStat(path)
                if (check && check.size > 0) {
                    itemPath = wx.env.USER_DATA_PATH + '/' + path
                }
                // if (itemPath === '') {
                //     if (this.data.imgSize === 1) {
                //         itemPath = await dbItem.getEntryFileTemp(entry, item.ref + '.min', item.pass, 'png')
                //         $g.log('临时Min : ', itemPath)
                //     }
                //     if (itemPath === '') {
                //         itemPath = await dbItem.getEntryFileTemp(entry, item.ref, item.pass, extend)
                //         $g.log('临时原始 : ', itemPath)
                //     }
                // }
                const fileItem: object = {
                    name: item.name,// 文件添加的时候的名称
                    ref: item.ref,// 整个路径 uuid + '.' + ref
                    pass: item.pass,// AES 加密的密码
                    size: item.size,// 解压后的长度
                    ram: item.size * 3,
                    file: itemPath,
                    path: '',
                    load: false,// 是否在下载
                }

                fileList.push(fileItem)
            }
        }

        // fileList.length = 0
        // for (let i = 1; i < 5; i++) {
        //     const fileItem: object = {
        //         name: i.toString(),
        //         ref: '',
        //         pass: '',
        //         size: 0,
        //         ram: 0,
        //         file: wx.env.USER_DATA_PATH + '/' + i + '.png',
        //         path: '',
        //         load: false,// 是否在下载
        //     }
        //     fileList.push(fileItem)
        // }

        this.setData({
            fileList: fileList,
            swiperIndex: this.data.swiperIndex
        }, () => {
            this.setSwiperIndex(this.data.swiperIndex)
        })
        //that.setData({ captchaImage: 'data:image/png;base64,' + base64});

    },
    btSwiperChange(e: any) {
        $g.log('btSwiperChange', e)
        const index: number = Number(e.detail.current)
        this.data.swiperIndex = index
        this.setSwiperIndex(index)
    },
    /** 设置 Swiper 里的信息 */
    async setSwiperIndex(index: number) {
        $g.log('展示序列 : ', index)
        if (this.data.fileList.length > index) {
            for (let i = 0; i < this.data.fileList.length; i++) {
                const item: any = this.data.fileList[i]
                if (i > index - 2 && i < index + 2) {
                    item.path = item.file
                } else {
                    item.path = ''
                }
            }
            await this.setDataPromise({ fileList: this.data.fileList })
            const item: any = this.data.fileList[index]
            this.setData({ pagetitle: item.name })
            if (item.path === '' && item.load === false) {
                const dbItem: DBItem = $g.g.dbLib.selectItem
                const entry: any = dbItem.selectEntry
                item.load = true
                let extend: string = 'tmp'
                const nameArray: Array<string> = item.name.split('.')
                if (nameArray.length > 1) extend = nameArray[nameArray.length - 1].toLocaleLowerCase()
                let path: string = ''
                if (this.data.imgSize === 1) {
                    path = await DBEntryApi.getEntryFileTemp(dbItem, entry, item.ref + '.min', item.pass, 'png')
                    $g.log('临时Min : ', path)
                }
                if (path === '') {
                    path = await DBEntryApi.getEntryFileTemp(dbItem, entry, item.ref, item.pass, extend)
                    $g.log('临时原始 : ', path)
                }
                item.file = path
                item.path = path
                item.load = false
                this.setData({ fileList: this.data.fileList })
            }
        } else {
            this.setData({ pagetitle: '文件展示' })
        }
    },
    setDataPromise(o: any): Promise<boolean> {
        return new Promise(resolve => {
            this.setData(o, () => {
                return resolve(true)
            })
        })
    },
    /** cover-image image 都有这个参数 */
    imageLoad(e: any) {
        $g.log('imageLoad', e)
        let index: number = Number(e.currentTarget.dataset.id)
        if (index > -1 && this.data.fileList.length > index) {
            $g.log('展示内容', this.data.fileList[index])
            // this.setData({ fileList: this.data.fileList })
        }
    },
    imageError(e: any) {
        $g.log('imageError', e)
    },
    // 长按保存图片
    saveImg(e: any) {
        $g.log('长按保存图片', e)
        const item: any = this.data.fileList[this.data.swiperIndex]
        let url: string = item.path
        //用户需要授权
        wx.getSetting({
            success: (res) => {
                if (!res.authSetting['scope.writePhotosAlbum']) {
                    wx.authorize({
                        scope: 'scope.writePhotosAlbum',
                        success: () => {
                            // 同意授权
                            this.saveImg1(url);
                        },
                        fail(e) {
                            $g.log(e)
                        }
                    })
                } else {
                    // 已经授权了
                    this.saveImg1(url);
                }
            },
            fail(e) {
                $g.log(e)
            }
        })
    },
    saveImg1(url: string) {
        wx.getImageInfo({
            src: url,
            success: (res) => {
                let path = res.path;
                wx.saveImageToPhotosAlbum({
                    filePath: path,
                    success(res) {
                        $g.log(res)
                        wx.showToast({ title: '已保存到相册' });
                    },
                    fail(e) {
                        $g.log(e)
                        wx.showToast({ title: '保存相册失败' })
                    }
                })
            },
            fail(e) {
                $g.log(e)
            }
        })
    },
})
