import { GBlock, GFileBase } from "./g.file.base";

export class GFileManage {

    /** 模式 : 1 二进制文件模式 , 2 散文件模式 */
    public model:number = 1

    /** 文件列表中的列表 */
    public fileList:Array<GFileBase> = new Array<GFileBase>()

    /** 文件列表中的空白区域 */
    public listBlock: Array<GBlock> = new Array<GBlock>()



}