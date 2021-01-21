import { GByteStream } from "./g.byte.stream";
import { GFileBase, IGFileBase } from "./g.file.base";

/**
 * 文件列表区
 */
export class GList implements IGFileBase {

    /** 文件列表 */
    public fileList: Array<IGFileBase> = new Array<IGFileBase>()

    /** 文件信息 → 二进制 **/
    public getHeadByte(): GByteStream {
        let b: GByteStream = new GByteStream()

        return b;
    }

    /** 文件信息 ← 二进制 **/
    public setHeadByte(b: GByteStream): void {


    }

}