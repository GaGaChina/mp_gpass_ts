import { GFileSize } from "../../lib/g-byte-file/g.file.size";
import { $g } from "../speed.do";
import { WXCompatible } from "./wx.compatible";

/**
 * 本地文件存储的大小限制为 10M
 * FileSystemManager 200M (听说可以存200M)
 * 下载的限制是50。存储到本地的限制是10
 * https://developers.weixin.qq.com/miniprogram/dev/framework/ability/file-system.html
 * 其中本地文件又分为三种：
 * 本地临时文件：临时产生，随时会被回收的文件。不限制存储大小
 * 本地缓存文件：通过接口把本地临时文件缓存后产生的文件，不能自定义目录和文件名。跟本地用户文件共计，普通小程序最多可存储 10MB，游戏类目最多可存储 50MB(老的)
 * 本地用户文件：通过接口把本地临时文件缓存后产生的文件，允许自定义目录和文件名。跟本地缓存文件共计，普通小程序最多可存储 10MB，游戏类目最多可存储 50MB(老的)
 * 本地用户文件：通过接口把本地临时文件缓存后产生的文件，允许自定义目录和文件名。跟本地缓存文件共计，小程序（含小游戏）最多可存储 200MB
 * https://developers.weixin.qq.com/miniprogram/dev/api/network/download/wx.downloadFile.html
 * 下载文件资源到本地。客户端直接发起一个 HTTPS GET 请求，返回文件的本地临时路径 (本地路径)，单次下载允许的最大文件为 50MB。使用前请注意阅读相关说明。
 * 
 * 本地临时文件:
 * tempFilePaths 的每一项是一个本地临时文件路径
 * wx.chooseImage({success(res) { res.tempFilePaths }})
 * 
 * 写入 : appendFile(文件尾追加) writeFile(写入文件)
 * 读取 : readFile(读取), (支持 position)
 * 
 * 打开手机文件的方法 :
 * 发送 文件给微信好友 -> 发送完毕后可以选择
 * 
 * C:\Users\GaGa\AppData\Local\微信开发者工具\User Data\1a695ca2de1a85735f93a43fb366c83f\WeappSimulator\WeappFileSystem\o6zAJs0prTNErnX58dQGA60JzcTQ\wx98e663f2bb3467bd\usr\db
 */
export class WXFile {

    public static manager: WechatMiniprogram.FileSystemManager = wx.getFileSystemManager();

    /**
     * 吊起用户选择文件 (只能选择微信内的图片和文件)
     * @param selectLength 选择的数量 (0-100)
     * @param fileType all 全部 video视频 image图片 file除图片视频的其他文件
     */
    public static chooseFile(selectLength: number = 1, fileType: 'all' | 'video' | 'image' | 'file' = 'file'): Promise<WechatMiniprogram.ChooseFile[]> {
        return new Promise(resolve => {
            if (!WXCompatible.canRun('2.5.0', '无法使用微信文件模块。')) return resolve([])
            wx.chooseMessageFile({
                count: selectLength,
                type: fileType,
                success: (res: WechatMiniprogram.ChooseMessageFileSuccessCallbackResult) => {
                    return resolve(res.tempFiles)
                },
                fail: (e: WechatMiniprogram.GeneralCallbackResult) => {
                    return resolve([])
                }
            })
        })
    }

    public static chooseImage(): void {
        wx.showActionSheet({
            itemList: ['拍照', '从相册中选择', '微信中的图片'],
            success(res) {
                if (res.tapIndex === 0) {
                    wx.chooseImage({
                        count: 1,
                        sizeType: ['original', 'compressed'],
                        sourceType: ['camera'],
                        success: function (res) {
                            //res.tempFilePaths[0] 这个是图片
                        },
                    })
                } else if (res.tapIndex === 1) {
                    wx.chooseImage({
                        count: 1,
                        sizeType: ['original', 'compressed'],
                        sourceType: ['album'],
                        success: function (res) {
                            //res.tempFilePaths[0] 这个是图片
                        },
                    })
                } else {
                    WXFile.chooseFile(1, 'image')
                }
            },
            fail(res) {
                $g.log(res.errMsg)
            }
        })
    }

    /**
     * 将一个临时文件保存到目录
     * 真实路径：手机\内部存储\tencent\MicroMsg\wxanewfiles\xxxx\abc.txt
     * xxxx：是一个很长的由英文数字组成的文件夹，这个文件夹的命名规则，尚不清楚
     * @param tempFilePath 临时存储文件路径
     * @param filePath 要存储的文件路径(已添加wx.env.USER_DATA_PATH/)
     */
    public static saveFile(tempFilePath: string, filePath: string): Promise<boolean> {
        return new Promise(async function (resolve) {
            if (!WXCompatible.canRun('1.9.9', '无法使用微信文件模块。')) return resolve(false)
            // 检查并创建文件夹
            if (await WXFile.checkDirectory(filePath)) {
                // 开始保存文件
                WXFile.manager.saveFile({
                    tempFilePath: tempFilePath,
                    filePath: `${wx.env.USER_DATA_PATH}/${filePath}`,
                    success: (res: WechatMiniprogram.FileSystemManagerSaveFileSuccessCallbackResult) => {
                        // $g.log('[wx.file][saveFile][success]', res);
                        return resolve(true)
                    },
                    fail: (e) => {
                        // $g.log('[wx.file][saveFile][fail]', e);
                        wx.showToast({ title: `保存文件失败, ${e.errMsg}`, icon: 'none', mask: false })
                        return resolve(false)
                    }
                })
            } else {
                return resolve(false)
            }
        })
    }

    /**
     * 拷贝 srcPath 到 copyPath
     * @param srcPath 源文件路径，支持本地路径
     * @param destPath 目标文件路径，支持本地路径
     */
    public static copyFile(srcPath: string, destPath: string): Promise<boolean> {
        return new Promise(async function (resolve) {
            if (await WXFile.checkDirectory(destPath)) {
                WXFile.manager.copyFile({
                    srcPath: `${wx.env.USER_DATA_PATH}/${srcPath}`,
                    destPath: `${wx.env.USER_DATA_PATH}/${destPath}`,
                    success: (res: WechatMiniprogram.GeneralCallbackResult) => {
                        // $g.log('[wx.file][copyFile][success]', res);
                        return resolve(true)
                    },
                    fail: (e) => {
                        // $g.log('[wx.file][copyFile][fail]', e);
                        wx.showToast({ title: `保存文件失败, ${e.errMsg}`, icon: 'none', mask: false })
                        return resolve(false)
                    }
                })
            } else {
                return resolve(false)
            }
        })
    }

    /**
     * 删除临时文件
     * @param tempFilePath 临时文件
     */
    public static clearTempFile(tempFilePath: string): Promise<boolean> {
        return new Promise(async function (resolve) {
            WXFile.manager.removeSavedFile({
                filePath: tempFilePath,
                success: (res: WechatMiniprogram.GeneralCallbackResult) => {
                    // $g.log('[wx.file][clearTempFile][success]', res);
                    return resolve(true)
                },
                fail: (e: WechatMiniprogram.RemoveSavedFileFailCallbackResult) => {
                    // $g.log('[wx.file][clearTempFile][fail]', e);
                    return resolve(false)
                }
            })
        })
    }

    /**
     * 检查路径中的文件夹是否创建完毕, 没有就创建
     * @param filePath 
     */
    public static async checkDirectory(filePath: string): Promise<boolean> {
        return new Promise(async function (resolve) {
            const fileList: Array<string> = filePath.split('/')
            if (fileList.length && fileList[fileList.length - 1].indexOf('.') !== -1) {
                fileList.pop()
            }
            let path: string = ''
            for (let i = 0; i < fileList.length; i++) {
                if (i !== 0) path += '/'
                path += fileList[i]
                let info: WechatMiniprogram.Stats | null = await WXFile.getFileStat(path)
                if (info === null || info.isDirectory() === false) {
                    if (await WXFile.mkdir(path) === false) {
                        return resolve(false)
                    }
                }
            }
            return resolve(true)
        })
    }

    /**
     * 创建文件夹
     * @param dirPath 
     */
    public static mkdir(dirPath: string): Promise<boolean> {
        return new Promise(resolve => {
            WXFile.manager.mkdir({
                dirPath: `${wx.env.USER_DATA_PATH}/${dirPath}`,
                success: (res: WechatMiniprogram.GeneralCallbackResult) => {
                    // $g.log('[wx.file][mkdir][success]', res);
                    return resolve(true)
                },
                fail: (e: WechatMiniprogram.MkdirFailCallbackResult) => {
                    // $g.log('[wx.file][mkdir][fail]', e);
                    return resolve(false)
                }
            })
        })
    }

    /**
     * 读取目录下的文件结构
     * @param dirPath 文件路径(已添加wx.env.USER_DATA_PATH/)
     */
    public static readdir(dirPath: string = ''): Promise<Array<string>> {
        return new Promise(resolve => {
            if (!WXCompatible.canRun('1.9.9', '无法使用微信文件模块。')) return resolve([])
            WXFile.manager.readdir({
                dirPath: `${wx.env.USER_DATA_PATH}/${dirPath}`,
                success: (res: WechatMiniprogram.ReaddirSuccessCallbackResult) => {
                    // $g.log('[wx.file][readdir][success]', res);
                    resolve(res.files)
                },
                fail: (e: WechatMiniprogram.ReaddirFailCallbackResult) => {
                    // $g.log('[wx.file][readdir][fail]', e);
                    resolve([])
                }
            })
        })
    }

    /**
     * 获取这个文件的信息
     * @param filePath 要存储的文件路径(已添加wx.env.USER_DATA_PATH/)
     */
    public static getFileStat(filePath: string, userPath: boolean = true): Promise<WechatMiniprogram.Stats | null> {
        if (userPath) filePath = `${wx.env.USER_DATA_PATH}/${filePath}`
        return new Promise(resolve => {
            WXFile.manager.stat({
                path: filePath,
                recursive: false,
                success: (res: WechatMiniprogram.StatSuccessCallbackResult) => {
                    // $g.log('[wx.file][FileStat][success]', res);
                    // 如果就一个文件返回 res.stats 对象
                    // 递归遍历就是一堆 res.stats = [ {path:'路径', stats: Stats对象} ]
                    const stats: any = res.stats
                    return resolve(stats)
                },
                fail: (e: WechatMiniprogram.StatFailCallbackResult) => {
                    // $g.log('[wx.file][FileStat][fail]', e);
                    return resolve(null)
                }
            })
        })
    }

    /**
     * 获取文件夹内的详情
     * @param path 路径
     * @param recursive 是否递归所有的文件夹
     * @param addUserPath 是否在path 后面自动添加 wx.env.USER_DATA_PATH
     */
    public static getStat(path: string, recursive: boolean, addUserPath: boolean = true): Promise<WXFileStats | Array<WXFileStats> | null> {
        if (addUserPath) path = `${wx.env.USER_DATA_PATH}/${path}`
        return new Promise(resolve => {
            WXFile.manager.stat({
                path: path,
                recursive: recursive,
                success: (res: WechatMiniprogram.StatSuccessCallbackResult) => {
                    if (res.stats) {
                        if ($g.isArray(res.stats)) {
                            const resList: Array<WXFileStats> = new Array<WXFileStats>()
                            const list: any = res.stats
                            $g.log('[WXFile.getStat]', list)
                            const listLen: number = list.length
                            if (listLen) {
                                for (let i = 0, l: number = listLen; i < l; i++) {
                                    const item: any = list[i]
                                    const resItem: WXFileStats = new WXFileStats()
                                    const file: WechatMiniprogram.Stats = item.stats
                                    resItem.path = item.path
                                    if (file.size) resItem.size = file.size
                                    resItem.mode = file.mode // Number(file.mode).toString(8)
                                    resItem.isDirectory = file.isDirectory()
                                    resItem.timeLastAccessed = file.lastAccessedTime
                                    resItem.timeLastModified = file.lastModifiedTime
                                    resList.push(resItem)
                                }
                            }
                            return resolve(resList)
                        } else {
                            const item: any = res.stats
                            if (item.stats) {
                                const resItem: WXFileStats = new WXFileStats()
                                const file: WechatMiniprogram.Stats = item.stats
                                resItem.path = item.path
                                if (file.size) resItem.size = file.size
                                resItem.mode = file.mode // Number(file.mode).toString(8)
                                resItem.isDirectory = file.isDirectory()
                                resItem.timeLastAccessed = file.lastAccessedTime
                                resItem.timeLastModified = file.lastModifiedTime
                                return resolve(resItem)
                            } else {
                                return resolve(null)
                            }
                        }
                    } else {
                        return resolve(null)
                    }
                },
                fail: (e: WechatMiniprogram.StatFailCallbackResult) => {
                    // $g.log('[wx.file][Stat]错误', e);
                    return resolve(null)
                }
            })
        })
    }

    /**
     * 获取文件或文件夹的尺寸
     * @param path 文件路径
     * @param recursive 是否递归, 遍历下面全部文件夹和文件
     * @param addUserPath 是否在path 后面自动添加 wx.env.USER_DATA_PATH
     */
    public static getFileSize(path: string, recursive: boolean = false, addUserPath: boolean = true): Promise<number> {
        if (addUserPath) path = `${wx.env.USER_DATA_PATH}/${path}`
        return new Promise(resolve => {
            WXFile.manager.stat({
                path: path,
                recursive: recursive,
                success: (res: WechatMiniprogram.StatSuccessCallbackResult) => {
                    if (res.stats) {
                        if ($g.isArray(res.stats)) {
                            let size: number = 0
                            const list: any = res.stats
                            const listLen: number = list.length
                            if (listLen) {
                                for (let i = 0, l: number = listLen; i < l; i++) {
                                    const file: WechatMiniprogram.Stats = list[i].stats
                                    const fileSize: number = file.size
                                    if (fileSize) size += fileSize
                                }
                            }
                            return resolve(size)
                        } else {
                            return resolve(res.stats.size)
                        }
                    }
                    return resolve(0)
                },
                fail: (e: WechatMiniprogram.StatFailCallbackResult) => {
                    return resolve(0)
                }
            })
        })
    }

    /**
     * 输出里面的文件情况
     * @param filePath 
     * @param recursive 是否递归获取目录下的每个文件的 Stats 信息
     * @param addUserPath 是否在path 后面自动添加 wx.env.USER_DATA_PATH
     */
    public static async logFileList(filePath: string, recursive: boolean = false, addUserPath: boolean = true): Promise<boolean> {
        if ($g.g.app.DEBUG) {
            const stat: WXFileStats | WXFileStats[] | null = await WXFile.getStat(filePath, recursive, addUserPath)
            if (stat) {
                const statAny: any = stat
                let log: string = ''
                if ($g.isArray(stat)) {
                    const listLen: number = statAny.length
                    if (listLen) {
                        for (let i = 0; i < listLen; i++) {
                            const statItem: WXFileStats = statAny[i]
                            log = `[ ${statItem.path} ]`
                            if (statItem.isDirectory) log += ' 文件夹'
                            if (statItem.size) log += ' size:' + GFileSize.getSize(statItem.size)
                            $g.log(log)
                        }
                        return true
                    }
                } else {
                    const statItem: WXFileStats = statAny
                    log = `[ ${statItem.path} ]`
                    if (statItem.isDirectory) log += ' 文件夹'
                    if (statItem.size) log += ' size:' + GFileSize.getSize(statItem.size)
                    $g.log(log)
                    return true
                }
            }
        }
        return false
    }

    /**
     * 读取目录下的文件结构
     * @param filePath 文件路径(已添加wx.env.USER_DATA_PATH/)
     * @param encoding 不传 encoding 按照二进制读取, 返回ArrayBuffer
     * @param position number
     * @param length number
     */
    public static readFile(filePath: string = '', position?: number, length?: number, encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'ucs2' | 'ucs-2' | 'utf16le' | 'utf-16le' | 'utf-8' | 'utf8' | 'latin1', userPath: boolean = true): Promise<string | ArrayBuffer | null> {
        return new Promise(resolve => {
            if (!WXCompatible.canRun('1.9.9', '无法使用微信文件模块。')) return resolve(null)
            if (userPath) filePath = `${wx.env.USER_DATA_PATH}/${filePath}`
            WXFile.manager.readFile({
                filePath: filePath,
                encoding: encoding,
                position: position,
                length: length,
                success: (res: WechatMiniprogram.ReadFileSuccessCallbackResult) => {
                    // $g.log('[wx.file][readFile][success]', res);
                    return resolve(res.data)
                },
                fail: (e: WechatMiniprogram.ReadFileFailCallbackResult) => {
                    // console.log('[wx.file][readFile][fail]', e);
                    wx.showToast({ title: `读取文件失败, ${e.errMsg}`, icon: 'none', mask: false })
                    return resolve(null)
                }
            })
        })
    }

    /**
     * 写入文件 (真机才能成功调用)
     * 
     * position 测试没有
        $g.log('写入一些测试数据')
        const filename:string = 'demo.byte'
        await WXFile.writeFile(filename, new ArrayBuffer(128))
        let back:string | ArrayBuffer | null = await WXFile.readFile(filename)
        $g.log('第一次读取 :', back)
        await WXFile.writeFile('demo.byte', new ArrayBuffer(128))
        back = await WXFile.readFile(filename)
        $g.log('第二次读取 :', back)
        await WXFile.writeFile(filename, new ArrayBuffer(128), '64')
        back = await WXFile.readFile(filename)
        $g.log('第三次读取 :', back)
     * 测试 在 PC 上 , 写入 在读取 文件会发生变化
     * @param filePath 文件路径(已添加wx.env.USER_DATA_PATH/)
     * @param data 
     * @param encoding 
     */
    public static writeFile(filePath: string = '', data: string | ArrayBuffer, position: number = 0, encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'ucs2' | 'ucs-2' | 'utf16le' | 'utf-16le' | 'utf-8' | 'utf8' | 'latin1'): Promise<boolean> {
        return new Promise(async function (resolve) {
            // 检查并创建文件夹
            if (await WXFile.checkDirectory(filePath)) {
                WXFile.manager.writeFile({
                    filePath: `${wx.env.USER_DATA_PATH}/${filePath}`,
                    data: data,
                    position: position,
                    encoding: encoding,
                    async success(res: WechatMiniprogram.GeneralCallbackResult) {
                        // $g.log('[wx.file][writeFile]写入成功')
                        return resolve(true)
                        // $g.log('[wx.file][writeFile]追加文件', filePath, data, encoding)
                        // resolve(await WXFile.appendFile(filePath, data, encoding))
                    },
                    fail: (e: any) => {
                        $g.log('[wx.file][writeFile][fail]', e);
                        wx.showToast({ title: '文件写入失败', icon: 'error' });
                        return resolve(false)
                    }
                })
            } else {
                return resolve(false)
            }
        })
    }

    /**
     * 在文件末尾追加
     * @param filePath 文件路径(已添加wx.env.USER_DATA_PATH/)
     * @param data 
     * @param encoding 
     */
    public static appendFile(filePath: string = '', data: string | ArrayBuffer, encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'ucs2' | 'ucs-2' | 'utf16le' | 'utf-16le' | 'utf-8' | 'utf8' | 'latin1'): Promise<boolean> {
        return new Promise(async function (resolve) {
            // 检查并创建文件夹
            if (await WXFile.checkDirectory(filePath)) {
                WXFile.manager.appendFile({
                    filePath: `${wx.env.USER_DATA_PATH}/${filePath}`,
                    data: data,
                    encoding: encoding,
                    success: (res: WechatMiniprogram.GeneralCallbackResult) => {
                        // $g.log('[wx.file][appendFile][success]', res)
                        return resolve(true)
                    },
                    fail: (e: any) => {
                        // $g.log('[wx.file][appendFile][fail]', e);
                        wx.showToast({ title: `文件追加失败, ${e.errMsg}`, icon: 'none', mask: false })
                        return resolve(false)
                    }
                })
            } else {
                return resolve(false)
            }
        })


    }


    /**
     * 删除文件
     * @param path 
     */
    public static delFile(path: string, addUserPath: boolean = true): Promise<boolean> {
        if (addUserPath) path = `${wx.env.USER_DATA_PATH}/${path}`
        return new Promise(resolve => {
            WXFile.manager.unlink({
                filePath: path,
                success: function (res) {
                    // $g.log('[wx.file][delFile][success]', res);
                    return resolve(true)
                },
                fail: function (e: any) {
                    // $g.log('[wx.file][delFile][fail]', e);
                    return resolve(false)
                }
            })
        })
    }


    /**
     * 删除文件夹
     * @param dirPath 路径
     * @param recursive 递归全部文件
     */
    public static rmDir(dirPath: string, recursive: boolean = true, addUserPath: boolean = true): Promise<boolean> {
        if (addUserPath) dirPath = `${wx.env.USER_DATA_PATH}/${dirPath}`
        return new Promise(resolve => {
            WXFile.manager.rmdir({
                dirPath: dirPath,
                recursive: recursive,
                success: function (res) {
                    // $g.log('[wx.file][rmDir][success]', res);
                    return resolve(true)
                },
                fail: function (e: any) {
                    // $g.log('[wx.file][rmDir][fail]', e);
                    return resolve(false)
                }
            })
        })
    }




    /**
     * 将用户本地文件保存到用户端
     * @param filePath 
     */
    public static openDocument(filePath: string): Promise<boolean> {
        return new Promise(resolve => {
            wx.openDocument({
                filePath: `${wx.env.USER_DATA_PATH}/${filePath}`,
                showMenu: true,
                success: function (res) {
                    // $g.log('[wx.file][openDocument][success]', res);
                    return resolve(true)
                },
                fail: function (e: any) {
                    // $g.log('[wx.file][openDocument][fail]', e);
                    return resolve(false)
                }
            })
        })
    }

    /**
     * 从网络地址直接下载一个文件, 然后可以用saveFile保存到本地
     */
    public static downloadFile(): any {
        let _this = this;
        const FileSystemManager = wx.getFileSystemManager()
        return new Promise((resolve, reject) => {
            wx.downloadFile({
                url: 'URL网络连接' + '/Api/Update/Item/?guid=' + 123,
                success(res) {
                    if (res.statusCode === 200) {
                        FileSystemManager.saveFile({//下载成功后保存到本地
                            tempFilePath: res.tempFilePath,
                            filePath: wx.env.USER_DATA_PATH + "/" + 123,
                            success(res2) {
                                if (res2.errMsg == 'saveFile:ok') {
                                    return resolve()
                                } else {
                                    return reject()
                                }
                            },
                            fail() {
                                return reject()
                            }
                        })
                    } else {
                        return reject()
                    }
                },
                fail() {
                    return reject()
                }
            })
        })
    }
}


export class WXFileStats {
    __name__ = 'WXFileStats'
    /** 文件路径, 获取后自动会将 path 的路径删除, 是已 / 开头 */
    public path: string = ''
    /** 是否是文件夹 */
    public isDirectory: boolean = false
    /** 文件大小, 赋值前要检测部位 under */
    public size: number = 0
    /** 文件最近一次被存取或被执行的时间，UNIX 时间戳，对应 POSIX stat.st_atime */
    public timeLastAccessed: number = 0
    /** 文件最后一次被修改的时间，UNIX 时间戳，对应 POSIX stat.st_mtime */
    public timeLastModified: number = 0
    /** 文件的类型和存取的权限，对应 POSIX stat.st_mode */
    public mode: string = ''
}