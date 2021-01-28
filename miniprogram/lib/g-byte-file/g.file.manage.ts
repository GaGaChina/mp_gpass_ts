import { GBlock, GFileBase } from "./g.file.base";

/**
 * 文件管理系统
 */
export class GFileManage {

    /**
     * 文件存储模式
     * 1 二进制整体文件模式
     *   以单独文件为运行模式, 输出的也是单独文件, 4G,4G的片文件是连接在一起的
     * 2 二进制碎片文件模式
     *   在文件夹中形成一个个的片文件, 文件夹的非本文件无视
     * 3 文件夹模式
     *   在文件夹里有 head 文件管理模块, 其他文件默认存储(需要维护文件夹文件列表和head文件列表情况)
     * 9 混合文件系统 - 二进制读取 文件夹操作
     *   优先读取文件夹中的 head 等
     *   先读入二进制文件系统 -> 如果二进制文件有(且未标注读取文件夹) -> 读取二进制内 -> 读取文件夹
     */
    public model:number = 1

    /** 文件列表中的列表 */
    public fileList:Array<GFileBase> = new Array<GFileBase>()

    /** 文件列表中的空白区域 */
    public listBlock: Array<GBlock> = new Array<GBlock>()



}