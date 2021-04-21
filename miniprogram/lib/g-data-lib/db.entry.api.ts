import { AES } from "../../frame/crypto/AES";
import { $g } from "../../frame/speed.do";
import { ToolBytes } from "../../frame/tools/tool.bytes";
import { WXFile } from "../../frame/wx/wx.file";
import { WXImage } from "../../frame/wx/wx.image";
import { Entry, Group, Kdbx } from "../kdbxweb/types";
import { DBItem } from "./db";
import { KdbxApi } from "./kdbx.api";

/**
 * 处理 Entry 的一些事务
 */
export class DBEntryApi {


    /**
     * 创建缩略图和icon图标
     * @param fileName 文件全名, 带扩展名
     * @param newPath `db/${this.path}/${uuid}/${ref}`
     * @param byte 解密后文件二进制
     * @param pass 加密的密码
     * @param fileItem 如果要设置宽度高度
     */
    public static async mackEntryIcon(fileName: string, newPath: string, ref: string, byte: ArrayBuffer | null, pass: string, fileItem: any, startStep: boolean = true): Promise<any> {
        // 如果是图片, 制作 .icon 和 .min(width 750)
        const nameArray: Array<string> = fileName.split('.')
        if (nameArray.length > 1) {
            let extend: string = nameArray[nameArray.length - 1]
            extend = extend.toLocaleLowerCase()
            if (byte && (extend === 'jpg' || extend === 'png' || extend === 'jpeg')) {
                // if (startStep && $g.step.index < $g.step.list.length) {
                //     $g.step.list[$g.step.index].title = this.getGroupToDiskStr + ',序号:' + this.getGroupToDiskTotle + ' (缩略图)'
                //     await $g.step.runMethod()
                // }
                let tempPath: string = `temp/${ref}.${extend}`
                // 如果有 byte 就保存 byte
                if ($g.isClass(byte, 'ArrayBuffer')) {
                    if (!await WXFile.writeFile(tempPath, byte, 0, 'binary')) {
                        $g.g.app.DEBUG && $g.log('[db.mackEntryIcon]保存临时文件失败')
                        return Promise.resolve()
                    }
                }
                tempPath = `${wx.env.USER_DATA_PATH}/${tempPath}`
                const aesObj: AES = new AES()
                await aesObj.setKey(pass)
                // 保存临时处理文件保存完毕
                const imgInfo: WechatMiniprogram.GetImageInfoSuccessCallbackResult | null = await WXImage.getImageInfo(tempPath)
                if (imgInfo) {
                    // $g.log('开始创建缩略图')
                    const temp750: string = await WXImage.imgScaleIn(tempPath, imgInfo.width, imgInfo.height, 750, $g.g.app.scene.winHeight, imgInfo.orientation)
                    // $g.log('创建缩略图:', tempPathMin)
                    if (temp750) {
                        const byte750: ArrayBuffer | null = <ArrayBuffer | null>await WXFile.readFile(temp750, undefined, undefined, undefined, false)
                        // $g.log('缩略图文件:', byteMin)
                        if (byte750 && byte750.byteLength < byte.byteLength) {
                            const aes750: ArrayBuffer | null = await aesObj.encryptCBC(byte750)
                            if (aes750) {
                                if ($g.g.systemInfo.brand === 'devtools') {
                                    const base64: string = ToolBytes.ArrayBufferToBase64(aes750)
                                    await WXFile.writeFile(newPath + '.min.aes', base64, 0, 'utf-8')
                                } else {
                                    await WXFile.writeFile(newPath + '.min.aes', aes750, 0, 'binary')
                                }
                                $g.g.app.DEBUG && $g.log(`[db.mackEntryIcon]缩略图750完毕:${newPath}.min.aes`)
                            }
                        }
                        await WXFile.delFile(temp750)
                    }
                    //----------------------------------------------
                    // if (startStep && $g.step.index < $g.step.list.length) {
                    //     $g.step.list[$g.step.index].title = this.getGroupToDiskStr + ',序号:' + this.getGroupToDiskTotle + ' (图标)'
                    //     await $g.step.runMethod()
                    // }
                    const temp120: string = await WXImage.imgScaleIn(tempPath, imgInfo.width, imgInfo.height, 120, 120, imgInfo.orientation)
                    // $g.log('创建图标:', tempPathIcon)
                    if (temp120) {
                        const byte120: ArrayBuffer | null = <ArrayBuffer | null>await WXFile.readFile(temp120, undefined, undefined, undefined, false)
                        // $g.log('图标文件:', byteIcon)
                        if (byte120) {
                            const aes120: ArrayBuffer | null = await aesObj.encryptCBC(byte120)
                            if (aes120) {
                                if ($g.g.systemInfo.brand === 'devtools') {
                                    const base64: string = ToolBytes.ArrayBufferToBase64(aes120)
                                    await WXFile.writeFile(newPath + '.icon.aes', base64, 0, 'utf-8')
                                } else {
                                    await WXFile.writeFile(newPath + '.icon.aes', aes120, 0, 'binary')
                                }
                                $g.g.app.DEBUG && $g.log(`[db.mackEntryIcon]缩略图120完毕:${newPath}.icon.aes`)
                            }
                        }
                    }
                } else {
                    $g.g.app.DEBUG && $g.log('[db.mackEntryIcon]获取临时文件信息失败')
                }
            }
        }
        return Promise.resolve()
    }

    public static async getEntryFile(dbItem: DBItem, entry: Entry, ref: string): Promise<ArrayBuffer | null> {
        if (entry && ref.length) {
            var gkv: any;
            if ($g.hasKey(entry.fields, 'GKeyValue')) {
                const gkvJSON: any = entry.fields['GKeyValue']
                gkv = JSON.parse(gkvJSON)
            } else {
                gkv = {}
            }
            if ($g.hasKey(gkv, 'filelist')) {
                const gkvFileList: [] = gkv['filelist']
                for (let i = 0; i < gkvFileList.length; i++) {
                    const gkvFileItem: any = gkvFileList[i]
                    if (gkvFileItem.ref === ref) {
                        return await DBEntryApi.getEntryRef(dbItem, entry, ref, gkvFileItem.pass)
                    }
                }
            }
        }
        return null
    }

    /**
     * 获取 Entry 里的 ref 对象
     * @param entry 条目(获取 uuid 用)
     * @param ref 文件的 ref
     * @param pass AES加密的密锁
     */
    public static async getEntryRef(dbItem: DBItem, entry: Entry, ref: string, pass: string): Promise<ArrayBuffer | null> {
        let uuidPath: string = KdbxApi.uuidPath(entry.uuid)
        if (uuidPath) {
            const path: string = `db/${dbItem.path}/${uuidPath}/${ref}.aes`
            let file: WechatMiniprogram.Stats | null = await WXFile.getFileStat(path)
            if (file && file.size > 0) {
                let byte: any = null
                if ($g.g.systemInfo.brand === 'devtools') {
                    const base64: any = await WXFile.readFile(path, undefined, undefined, 'utf-8')
                    if (base64) byte = ToolBytes.Base64ToArrayBuffer(base64)
                } else {
                    byte = await WXFile.readFile(path)
                }
                if (byte) {
                    const aesObj: AES = new AES()
                    await aesObj.setKey(pass)
                    const aes: ArrayBuffer | null = await aesObj.decryptCBC(byte)
                    return Promise.resolve(aes)
                }
            }
        }
        return Promise.resolve(null)
    }


    /**
     * 通过 ref 获取 Entry 条目中的文件, 解密, 存储在临时文件夹中, 并返回临时文件的路径
     * @param entry 获取的条目
     * @param ref ref值
     * @param pass AES解密密码
     * @param extend 临时文件扩展名(图片需扩展名)
     * @param startStep 是否自动开启进度条
     */
    public static async getEntryFileTemp(dbItem: DBItem, entry: Entry, ref: string, pass: string, extend: string = 'tmp', startStep: boolean = true): Promise<string> {
        // 'temp/<ref>.icon.png   db/this.path/UUID/ref.icon
        $g.g.app.DEBUG && $g.log('[db.getEntryFileTemp]获取临时文件:' + ref)
        let outPath: string = 'temp/' + ref
        if (extend) outPath += '.' + extend
        // 检查临时文件是否已经有

        let checkFile: WechatMiniprogram.Stats | null = await WXFile.getFileStat(outPath)
        $g.g.app.DEBUG && $g.log('[db.getEntryFileTemp]检查临时文件:' + outPath, checkFile)
        if (checkFile && checkFile.size > 0) {
            // let checkImg: WechatMiniprogram.GetImageInfoSuccessCallbackResult | null = await WXImage.getImageInfo(`${wx.env.USER_DATA_PATH}/${outPath}`)
            // $g.g.app.DEBUG && $g.log('[db.getEntryFileTemp]检查临时图片:' + outPath, checkImg)
            // if (checkImg) {
            //     return Promise.resolve(`${wx.env.USER_DATA_PATH}/${outPath}`)
            // }
            return Promise.resolve(`${wx.env.USER_DATA_PATH}/${outPath}`)
        }

        // 获取文件, 并保存
        let uuidPath: string = KdbxApi.uuidPath(entry.uuid)
        if (uuidPath) {
            const filePath: string = `db/${dbItem.path}/${uuidPath}/${ref}.aes`
            if (startStep) {
                $g.step.clear()
                $g.step.add('检查加密文件')
                $g.step.add('获取加密内容')
                $g.step.add('解密文件内容')
                $g.step.add('保存临时文件')
                await $g.step.jump(0)
            }
            let file: WechatMiniprogram.Stats | null = await WXFile.getFileStat(filePath)
            if (file && file.size > 0) {
                let byte: ArrayBuffer | null = null
                if (startStep) await $g.step.jump(1)
                if ($g.g.systemInfo.brand === 'devtools') {
                    const base64: string | null = <string | null>await WXFile.readFile(filePath, undefined, undefined, 'utf-8')
                    if (base64) byte = ToolBytes.Base64ToArrayBuffer(base64)
                } else {
                    byte = <ArrayBuffer | null>await WXFile.readFile(filePath)
                }
                if (byte) {
                    if (startStep) await $g.step.jump(2)
                    const aesObj: AES = new AES()
                    await aesObj.setKey(pass)
                    const aes: ArrayBuffer | null = await aesObj.decryptCBC(byte)
                    if (aes) {
                        if (startStep) await $g.step.jump(3)
                        if (await WXFile.writeFile(outPath, aes, 0, 'binary')) {
                            if ($g.g.app.DEBUG) {
                                $g.log('[db.getEntryFileTemp]成功', outPath)
                                $g.log('[db.getEntryFileTemp]成功文件信息', ref, await WXFile.getFileStat(outPath))
                                $g.log('[db.getEntryFileTemp]成功图片信息', ref, await WXImage.getImageInfo(`${wx.env.USER_DATA_PATH}/${outPath}`))
                            }
                            if (startStep) $g.step.clear()
                            return Promise.resolve(`${wx.env.USER_DATA_PATH}/${outPath}`)
                        } else {
                            if (startStep) $g.step.clear()
                            $g.g.app.DEBUG && $g.log('[db.getEntryFileTemp]临时文件保存失败:' + aes)
                            return Promise.resolve('')
                        }
                    }
                } else {
                    $g.g.app.DEBUG && $g.log('[db.getEntryFileTemp]文件加密内容获取失败:' + byte)
                }
            } else {
                $g.g.app.DEBUG && $g.log('[db.getEntryFileTemp]读取文件失败:' + filePath)
            }
        }
        if (startStep) $g.step.clear()
        return Promise.resolve('')
    }



}