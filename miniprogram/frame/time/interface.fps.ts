/** 题目数据格式 */
interface IFPS {
    /** 计时器的默认fps */
    fps:number,
    /** 计时器每次触发的心跳 */
    heart:Function,
}