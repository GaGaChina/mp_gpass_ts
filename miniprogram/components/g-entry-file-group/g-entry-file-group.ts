import { AES } from "../../frame/crypto/AES"
import { SHA256 } from "../../frame/crypto/SHA256"
import { $g } from "../../frame/speed.do"
import { ToolBytes } from "../../frame/tools/tool.bytes"
import { WXFile } from "../../frame/wx/wx.file"
import { DBItem } from "../../lib/g-data-lib/db"
import { KdbxApi } from "../../lib/g-data-lib/kdbx.api"
import { Entry } from "../../lib/kdbxweb/types"
import { DataStepItem } from "../../frame/data/data.step"
import { WXKeepScreen } from "../../frame/wx/wx.keep.screen"

Component({
    options: {
        styleIsolation: 'isolated',
    },
    /** 组件属性列表 properties和data指向同对象, 可定义函数 */
    properties: {
        /** 默认的icon图标 */
        list: { type: Array, value: [] },
        /** add:添加条目, edit:编辑条目, show:展示条目 */
        type: { type: String, value: 'show' }
    },
    /** 组件的内部数据 */
    data: {
        /** 是否有文件的名称一样的 */
        warningkey: new Array<any>(),
        /** 选择文件所属的index, 如果是-1就是添加 */
        fileSelectIndex: -1,
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        /** 实例进入页面节点树时执行),可以setData */
        attached() {
            // $g.log('[组件][Entry-File-Group]创建', this.data);
            this.checkNameFun()
        }
    },
    /** 组件的方法列表 */
    methods: {
        infoChange(e: any) {
            // $g.log('[组件][Entry-File-Group]', e)
            const info: any = e.detail
            this.data.list[info.index] = e.detail
            this.checkNameFun()
            this.triggerEvent('change', this.data.list);
        },
        /** 父列表删除一个字段 */
        fileDel(e: any) {
            const info: any = e.detail
            this.data.list.splice(info.index, 1)
            for (let i = 0; i < this.data.list.length; i++) {
                const item: any = this.data.list[i]
                item.index = i
            }
            this.checkNameFun()
            this.setData({ list: this.data.list })
            this.triggerEvent('change', this.data.list);
        },
        /** 检查 文件名称 有没重复 */
        checkNameFun() {
            let nameList: Array<string> = new Array<string>()
            let nameLen: Array<number> = new Array<number>()
            let nameLib: Array<Array<number>> = new Array<Array<number>>()
            this.data.warningkey.length = 0
            for (let i = 0; i < this.data.list.length; i++) {
                const info: any = this.data.list[i]
                this.data.warningkey.push(false)
                if (info.name === '') {
                    this.data.warningkey[i] = true
                } else {
                    let keyIndex: number = nameList.indexOf(info.name.toLocaleLowerCase())
                    if (keyIndex === -1) {
                        nameList.push(info.name.toLocaleLowerCase())
                        nameLen.push(1)
                        nameLib.push([i])
                    } else {
                        nameLen[keyIndex] = nameLen[keyIndex] + 1
                        nameLib[keyIndex].push(i)
                    }
                }
            }
            for (let i = 0; i < nameList.length; i++) {
                if (nameLen[i] > 1) {
                    for (let j = 0; j < nameLib[i].length; j++) {
                        this.data.warningkey[nameLib[i][j]] = true
                    }
                }
            }
            this.setData({ warningkey: this.data.warningkey })
        },
        /** 查看是那个按钮 */
        changeFile(e: any) {
            // $g.log('[组件][Entry-File-Group]', e)
            const index: number = Number(e.detail.index)
            // 回传看是那个要修改文件
            this.data.fileSelectIndex = index
            this.btAddFile(null)
        },
        btAddFile(e: any) {
            if (e !== null) this.data.fileSelectIndex = -1
            const that = this
            wx.showActionSheet({
                itemList: ['拍照', '从相册中选择', '微信中的图片'],
                async success(res) {
                    switch (res.tapIndex) {
                        case 0:
                            wx.chooseImage({
                                count: 1,
                                sizeType: ['original', 'compressed'],
                                sourceType: ['camera'],
                                success: function (res) {
                                    $g.log('chooseImage', res)
                                    const chooseList: Array<Object> = new Array<Object>()
                                    if (res.tempFiles.length) {
                                        for (let i = 0; i < res.tempFiles.length; i++) {
                                            const item: WechatMiniprogram.ImageFile = res.tempFiles[i]
                                            const add: Object = {
                                                path: item.path,
                                                size: item.size
                                            }
                                            chooseList.push(add)
                                        }
                                        that.addListFile(chooseList)
                                    }
                                },
                            })
                            break;
                        case 1:
                            wx.chooseImage({
                                count: that.data.fileSelectIndex === -1 ? 20 : 1,
                                sizeType: ['original', 'compressed'],
                                sourceType: ['album'],
                                success: function (res) {
                                    // $g.log('chooseImage', res)
                                    const chooseList: Array<Object> = new Array<Object>()
                                    if (res.tempFiles.length) {
                                        for (let i = 0; i < res.tempFiles.length; i++) {
                                            const item: WechatMiniprogram.ImageFile = res.tempFiles[i]
                                            const add: Object = { path: item.path, size: item.size }
                                            chooseList.push(add)
                                        }
                                        that.addListFile(chooseList)
                                    }
                                },
                            })
                            break;
                        default:
                            const list: WechatMiniprogram.ChooseFile[] = await WXFile.chooseFile(9, 'image')
                            const chooseList: Array<Object> = new Array<Object>()
                            for (let i = 0; i < list.length; i++) {
                                const item: WechatMiniprogram.ChooseFile = list[i]
                                const add: Object = { path: item.path, size: item.size }
                                chooseList.push(add)
                            }
                            that.addListFile(chooseList)
                    }
                },
                fail(res) {
                    $g.log(res)
                }
            })
        },
        /**
         * 添加文件
         * @param list 参数为 path size
         */
        async addListFile(list: Array<Object>): Promise<void> {
            const KdbxUuid: any = KdbxApi.kdbxweb.KdbxUuid
            const dbItem: DBItem = $g.g.dbLib.selectItem
            if (dbItem.selectEntry) {
                const entry: Entry = dbItem.selectEntry
                WXKeepScreen.on()
                $g.step.clear()
                for (let i = 0; i < list.length; i++) {
                    const item: any = list[i]
                    const path: string = item.path
                    const pathArr: Array<string> = path.split('/')
                    const name: string = pathArr[pathArr.length - 1]
                    const setp: DataStepItem = $g.step.add('处理:' + name)
                    setp.add('读取文件内容')
                    setp.add('获取文件哈希,检查重复')
                    setp.add('文件内容加密')
                    setp.add('写入文件系统')
                    setp.add('创建缩略图')
                    setp.smallIndex = 0
                }
                for (let i = 0; i < list.length; i++) {
                    const item: any = list[i]
                    const path: string = item.path
                    const pathArr: Array<string> = path.split('/')
                    const name: string = pathArr[pathArr.length - 1]
                    const nameArr: Array<string> = name.split('.')
                    let extend: string = ''
                    if (nameArr.length) extend = nameArr[nameArr.length - 1].toLocaleLowerCase()
                    // --------------------- 直接读取文件
                    await $g.step.nextMin()
                    const byte: any = await WXFile.readFile(path, undefined, undefined, undefined, false)
                    if (byte) {
                        await $g.step.nextMin()
                        const sha256: ArrayBuffer = await SHA256.sha256(byte)
                        const ref: string = ToolBytes.byteToHex(new Uint8Array(sha256))
                        // 检查 ref 重复性
                        const findREF: any = this.listFindRef(ref)
                        if (findREF) {
                            wx.showModal({ title: '重复文件', content: `找到文件 ${findREF.name} 和文件 ${name} 相同, 绕过`, showCancel: false })
                        } else {
                            const uuid: string = KdbxApi.uuidPath(entry.uuid)
                            const pass: string = KdbxUuid.random().toString()
                            await $g.step.nextMin()
                            const aesObj: AES = new AES()
                            await aesObj.setKey(pass)
                            const aes: ArrayBuffer | null = await aesObj.encryptCBC(byte)
                            if (aes) {
                                const newPath: string = `db/${dbItem.path}/${uuid}/${ref}`
                                const info: any = {
                                    index: this.data.list.length,
                                    name: name,
                                    ref: ref,
                                    pass: pass,
                                    size: item.size,
                                    savetype: 'byte',
                                }
                                await $g.step.nextMin()
                                if ($g.g.systemInfo.brand === 'devtools') {
                                    const base64: string = ToolBytes.ArrayBufferToBase64(aes)
                                    await WXFile.writeFile(newPath + '.aes', base64, 0, 'utf-8')
                                    info['savetype'] = 'base64'
                                } else {
                                    await WXFile.writeFile(newPath + '.aes', aes, 0, 'binary')
                                }
                                await $g.step.nextMin()
                                // 从目录转存文件
                                let tempPath: string = `temp/${ref}.${extend}`
                                if (await WXFile.saveFile(path, tempPath)) {
                                    await dbItem.mackEntryIcon(name, newPath, ref, null, pass, info, false)
                                }
                                // 处理添加图片和替换图片
                                if (this.data.fileSelectIndex !== -1 && i === 0) {
                                    const changeItem: any = this.data.list[this.data.fileSelectIndex]
                                    changeItem.ref = info.ref
                                    changeItem.pass = info.pass
                                    changeItem.size = info.size
                                    changeItem.savetype = info.savetype
                                } else {
                                    this.data.list.push(info)
                                }
                            }
                        }
                    }
                    $g.step.next()
                }
                $g.step.clear()
                WXKeepScreen.off()
                this.setData({ list: this.data.list })
                this.triggerEvent('change', this.data.list);
            }
        },
        listFindRef(ref: string): Object | null {
            for (let i = 0; i < this.data.list.length; i++) {
                const item = this.data.list[i]
                if (item.ref === ref) {
                    return item
                }
            }
            return null
        },
        /** 展示全部文件 */
        async fileShow(e: any): Promise<void> {
            const listLength: number = this.data.list.length
            if (listLength) {
                WXKeepScreen.on()
                $g.step.clear()
                for (let i = 0; i < listLength; i++) {
                    const item = this.data.list[i]
                    const name: string = item.name
                    const nameArr: Array<string> = name.split('.')
                    if (nameArr.length > 1) nameArr.pop()
                    const setp: DataStepItem = $g.step.add('解密:' + nameArr.join('.'))
                    setp.add('检查缓存文件')
                    setp.add('解密缓存文件')
                    setp.smallIndex = 0
                }
                const index: number = Number(e.detail.index)
                const showMin: boolean = Boolean(e.detail.min)
                const dbItem: DBItem = $g.g.dbLib.selectItem
                const entry: any = dbItem.selectEntry
                const urls: Array<string> = new Array<string>()
                let selectURL: string = ''
                for (let i = 0; i < listLength; i++) {
                    await $g.step.nextMin()
                    const item = this.data.list[i]
                    let itemPath: string = ''
                    let extend: string = ''
                    const nameArray: Array<string> = item.name.split('.')
                    if (nameArray.length > 1) extend = nameArray[nameArray.length - 1].toLocaleLowerCase()
                    if (extend === 'jpg' || extend === 'png' || extend === 'jpeg') {
                        let path: string = 'temp/' + item.ref
                        if (showMin) {
                            path += '.min.png'
                        } else {
                            if (extend.length) path += '.' + extend
                        }
                        let check: WechatMiniprogram.Stats | null = await WXFile.getFileStat(path)
                        if (check && check.size > 0) {
                            itemPath = wx.env.USER_DATA_PATH + '/' + path
                        }
                        if (itemPath === '') {
                            await $g.step.nextMin()
                            if (showMin) {
                                itemPath = await dbItem.getEntryFileTemp(entry, item.ref + '.min', item.pass, 'png', false)
                                if (itemPath === '') {
                                    $g.log('临时Min图片获取失败')
                                }
                            }
                            if (itemPath === '') {
                                itemPath = await dbItem.getEntryFileTemp(entry, item.ref, item.pass, extend, false)
                            }
                        }
                        if (item.index === index) selectURL = itemPath
                        urls.push(itemPath)
                    }
                    $g.step.next()
                }
                $g.step.clear()
                WXKeepScreen.off()
                if (urls.length) {
                    wx.previewImage({
                        current: selectURL, // 当前显示图片的http链接
                        urls: urls // 需要预览的图片http链接列表
                    })
                }
            }


        }
    },
})
