import { GByteStream } from "./g.byte.stream";
import { GFileConfig, IGFileBase } from "./g.file.base";

/**
 * 文件头信息
 * 
 * 双备份, 操作1后,操作2,在操作就用1, 保证以外的回退, API中可以进行清理
 */
export class GFileLog implements IGFileBase {

    /** 二进制头的ID号 */
    public type:number = GFileConfig.TYPE_001_LOG
    /** 最多纪录多少条日志 */
    public logMax: number = 5
    /** 日志的堆栈,最新的在最前面 */
    public logLib: Array<IGFileBase> = new Array<IGFileBase>()
    /** 有多少个大文件, 4G 一个 */
    public fileLength: number = 0
    /** 本文件编号 */
    public fileId: number = 0

    /** 文件信息 → 二进制 **/
    public getHeadByte(): GByteStream {
        let b: GByteStream = new GByteStream()
        b.wUint(this.logMax)
        let l: number = this.logLib.length
        b.wUint(l)
        for (let i = 0; i < l; i++) {
            const item: IGFileBase = this.logLib[i]
            if (item instanceof GFileLogItemAdd) {
                b.wUint(1)
            } else {
                b.wUint(0)
            }
            // 添加长度更加强健
            b.wByteAuto(item.getHeadByte().u8)
        }
        b.wUint(this.fileLength)
        b.wUint(this.fileId)
        return b;
    }

    /** 文件信息 ← 二进制 **/
    public setHeadByte(b: GByteStream): void {
        this.logMax = b.rUint()
        let l: number = b.rUint()
        while (l-- > 0) {
            const type: number = b.rUint()
            let item: IGFileBase;
            if (type === 1) {
                item = new GFileLogItemAdd()
            } else {
                throw new Error("找不到类型");
            }
            let itemByte: ArrayBuffer | null = b.rByteAuto()
            if (itemByte) {
                item.setHeadByte(new GByteStream(itemByte))
            }
        }
        this.fileLength = b.rUint()
        this.fileId = b.rUint()
    }
}


/**
 * sleep : 还未初始化
 * finish : 完成, 删除 Blank 区完成
 * start : 开始写入
 * addOk : 写入完成 (失败, 忽略操作, 结果是操作失败)
 * addList : 写入文件列表 (写入文件列表失败, 忽略操作, 结果是操作失败)
 * addListOk : 文件列表写入完成(失败继续删除空白区)
 */
enum GFileLogItemAddState { sleep = -2, finish = -1, start = 0, addOk = 1, addList = 2, addListOk = 3 }
/** 当数据需要增加的时候,进行的追踪操作 */
export class GFileLogItemAdd implements IGFileBase {

    /** 现在的状态, -2未启用, -1完成, 0开始, 其他往下走中 */
    public state: GFileLogItemAddState = GFileLogItemAddState.sleep
    /** 空白区的重长度, 对不上就回滚 */
    public blockLength: number = 0
    /** 空白区的索引列表 */
    public blockIndex: Array<number> = new Array<number>()

    /** 文件信息 → 二进制 **/
    public getHeadByte(): GByteStream {
        let b: GByteStream = new GByteStream()
        b.wInt8(this.state)
        b.wUint(this.blockLength)
        const l: number = this.blockIndex.length
        b.wUint(l)
        for (let i = 0; i < l; i++) {
            b.wUint(this.blockIndex[i])
        }
        b.cutToPos()
        return b;
    }

    /** 文件信息 ← 二进制 **/
    public setHeadByte(b: GByteStream): void {
        this.state = b.rInt8()
        this.blockLength = b.rUint()
        let l: number = b.rUint()
        this.blockIndex.length = 0
        while (l-- > 0) {
            this.blockIndex.push(b.rUint())
        }
    }
}