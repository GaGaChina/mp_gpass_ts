import { $g } from "../../frame/speed.do"
import { WXFile } from "../../frame/wx/wx.file";
import { WXImage } from "../../frame/wx/wx.image";
import { GFileSize } from "../../lib/g-byte-file/g.file.size";
import { DBItem, DBLib } from "../../lib/g-data-lib/db";
import { KdbxApi } from "../../lib/g-data-lib/kdbx.api";

/**
 * 组件, 单条的编辑对象
 * info : 传递的对象, 不要对双向绑定, 需要进行监听
 * change : 会把对象回传回去
 */
Component({
    options: {
        styleIsolation: 'isolated',
    },
    /** 组件属性列表 properties和data指向同对象, 可定义函数 */
    properties: {
        /** 是否显示下边条 */
        showborder: { type: Boolean, value: true },
        /** add:添加条目, edit:编辑条目, show:展示条目 */
        type: { type: String, value: 'show' },
        /** 原始内容的引用 */
        source: { type: Object, value: {} },
        /** 在列表中的位置 */
        index: { type: Number, value: 0 },
        warningkey: { type: Boolean, value: false },
    },
    /** 组件的内部数据 */
    data: {
        /** 直接将对象进行引用 */
        info: {
            index: 0,// 值在列表中的序列
            name: '', // 文件添加的时候的名称, 包含扩展名
            ref: '', // 整个路径 uuid + '.' + ref
            pass: '', // AES 加密的密码
            size: '', // byte.byteLength,// 解压后的长度
            savetype: '',// base64 byte binaries
            // width: 0,// 如果是图片就有宽高
            // height: 0,// 如果是图片就有宽高
        },
        imgPath: '',
        showName: '',
        sizeStr: '',
        fileIcon: '',
        fileType: '',
        fileExtend: '',
        iconWidth: 120,
        iconHeight: 120,
    },
    /** 数据字段监听器，监听 setData 的 properties 和 data 变化 */
    observers: {
        'source': function () {
            if (this.handleSource(true)) {
                this.setData({ info: this.data.info })
                this.checkFileItem()
            }
        },
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        /** 实例进入页面节点树时执行),可以setData */
        attached() {
            // $g.log('[组件][g-entry-file]创建', this.data)
            if (this.handleSource(true)) {
                this.setData({ info: this.data.info })
                this.checkFileItem()
            }
        }
    },
    /** 组件的方法列表 */
    methods: {
        /**
         * 拷贝值
         * @param isGet 是否是获取 Source 到本地
         */
        handleSource(isGet: boolean): boolean {
            const list: Array<string> = Object.keys(this.data.info)
            let isChange: boolean = false
            const datainfo: any = this.data.info
            for (let i = 0; i < list.length; i++) {
                const key = list[i]
                if ($g.hasKey(this.data.source, key)) {
                    if (datainfo[key] !== this.data.source[key]) {
                        if (isGet) {
                            datainfo[key] = this.data.source[key]
                        } else {
                            this.data.source[key] = datainfo[key]
                        }
                        isChange = true
                    }
                }
            }
            return isChange
        },
        inputNameChange(e: any) {
            $g.log('[g-entry-file]修改名称:', e.detail.value, this.data)
            const s: string = e.detail.value.trim()
            if (this.data.showName !== s) {
                $g.g.app.timeMouse = Date.now()
                this.data.showName = s
                if (s) {
                    this.data.info.name = s + '.' + this.data.fileExtend
                } else {
                    this.data.info.name = ''
                }
                this.data.source.name = this.data.info.name
                this.triggerEvent('change', this.data.source)
            }
        },
        /** 对文件信息进行进一步的加工 */
        async checkFileItem() {
            const info: any = this.data.info
            // 文件扩展名
            let extend: string = ''
            let showName: string = info.name
            const nameArr: Array<string> = info.name.split('.')
            if (nameArr.length > 1) {
                extend = nameArr[nameArr.length - 1].toLocaleLowerCase()
                nameArr.pop()
                showName = nameArr.join('.')
            }
            let icon: string = 'file-o'
            let type: string = ''
            let iconWidth: number = 120
            let iconHeight: number = 120
            const dbItem: DBItem = $g.g.dbLib.selectItem
            switch (extend) {
                case 'jpg':
                case 'jpeg':
                case 'png':
                case 'bmp':
                case 'gif':
                    type = 'image'
                    icon = 'file-photo-o'
                    const entry: any = dbItem.selectEntry
                    this.data.imgPath = await dbItem.getEntryFileTemp(entry, info.ref + '.icon', info.pass, 'png')
                    if (this.data.imgPath) {
                        const imgInfo: WechatMiniprogram.GetImageInfoSuccessCallbackResult | null = await WXImage.getImageInfo(this.data.imgPath)
                        if (imgInfo) {
                            iconWidth = imgInfo.width
                            iconHeight = imgInfo.height
                        }
                    } else {
                        this.data.imgPath = await dbItem.getEntryFileTemp(entry, info.ref, info.pass, extend)
                        if (this.data.imgPath) {
                            // 检查文件大小, 如果文件
                            const imgInfo: WechatMiniprogram.GetImageInfoSuccessCallbackResult | null = await WXImage.getImageInfo(this.data.imgPath)
                            if (imgInfo) {
                                if (imgInfo.width > 120 || imgInfo.height > 120) {
                                    const byte: any = await WXFile.readFile(this.data.imgPath, undefined, undefined, undefined, false)
                                    if (byte) {
                                        const uuidPath: string = KdbxApi.uuidPath(entry.uuid)
                                        const newPath: string = `db/${dbItem.path}/${uuidPath}/${info.ref}`
                                        await dbItem.mackEntryIcon(info.name, newPath, info.ref, byte, info.pass, null)
                                        // --- 在读取一次
                                        const imgPath2: string = await dbItem.getEntryFileTemp(entry, info.ref + '.icon', info.pass, 'png')
                                        if (imgPath2) {
                                            $g.log('补全缩略图成功')
                                            this.data.imgPath = imgPath2
                                            const imgInfo: WechatMiniprogram.GetImageInfoSuccessCallbackResult | null = await WXImage.getImageInfo(imgPath2)
                                            if (imgInfo) {
                                                iconWidth = imgInfo.width
                                                iconHeight = imgInfo.height
                                            }
                                        }
                                    }
                                } else {
                                    iconWidth = imgInfo.width
                                    iconHeight = imgInfo.height
                                }
                            }
                        }
                        $g.log('原始路径', this.data.imgPath)

                    }
                    // $g.log('图标文件:', await WXFile.getFileStat(this.data.imgPath, false))
                    // $g.log('图标信息:', await WXImage.getImageInfo(this.data.imgPath))
                    break;
                case 'txt':
                    type = 'txt'
                    icon = 'file-text-o'
                    break;
                case 'mp3':
                    type = 'sound'
                    icon = 'file-sound-o'
                    break;
                case 'mp4':
                    type = 'movie'
                    icon = 'file-movie-o'
                    break;
                case 'doc':
                case 'docx':
                    type = 'word'
                    icon = 'file-word-o'
                    break;
                case 'xlsx':
                    type = 'excel'
                    icon = 'file-excel-o'
                    break;
                case 'pdf':
                    type = 'pdf'
                    icon = 'file-pdf-o'
                    break;
                default:
                    break;
            }
            this.setData({
                sizeStr: GFileSize.getSize(info.size, 3),
                imgPath: this.data.imgPath,
                showName: showName,
                fileIcon: icon,
                fileType: type,
                fileExtend: extend,
                iconWidth: iconWidth,
                iconHeight: iconHeight
            })
        },
        btDel(e: any) {
            this.triggerEvent('del', this.data.source)
        },
        btShow(e: any) {
            // wx.navigateTo({ url: '/pages/showdb/fileshow/fileshow?size=1&index=' + this.data.index })
            this.viewImage(true)
        },
        btShowSource(e: any) {
            // wx.navigateTo({ url: '/pages/showdb/fileshow/fileshow?index=' + this.data.index })
            this.viewImage()
        },
        async viewImage(imgSize: boolean = false) {
            this.triggerEvent('show', { min: imgSize, index: this.data.info.index })
        },
        btSelectFile(e: any) {
            this.triggerEvent('changefile', { index: this.data.info.index })
        }
    },

})
