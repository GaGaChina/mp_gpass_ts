import { GByteStream } from "./g.byte.stream";
import { GFileConfig, IGFileBase } from "./g.file.base";

/**
 * 文件头信息
 * 
 * 双备份, 操作1后,操作2,在操作就用1, 保证以外的回退, API中可以进行清理
 */
export class GFileHead implements IGFileBase {


    public type:number = GFileConfig.TYPE_000_HEAD

    /** 二进制头的ID号 */
    public static readonly HEAD_ID: number = 0
    /** 现在这个模块的版本号 */
    public static readonly VER: number = 1
    /** 文件系统最大尺寸 */
    public fileSizeMax:number = 200 * 1024 * 1024

    public name: string = 'GaBF'

    /** 有多少个大文件, 4G 一个 */
    public fileLength: number = 0
    /** 本文件编号 */
    public fileId: number = 0
    /** Uint8,启动后按那个启动顺序读取 1 读取1号, 2 读取2号 */
    public startReadId: number = 1
    public startRead1:[] = []
    public startRead2:[] = []

    /** 文件信息 → 二进制 **/
    public getHeadByte(): GByteStream {
        let b: GByteStream = new GByteStream()

        return b;
    }

    /** 文件信息 ← 二进制 **/
    public setHeadByte(b: GByteStream): void {


    }


}