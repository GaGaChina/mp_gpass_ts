/**
 * 一些格式的处理
 */
export class TimeFormat {

    /** 2020-01-01 17:24:30 */
    public static showLang(date: Date): string {
        let s: string = date.getFullYear().toString()
        let t: string = (date.getMonth() + 1).toString()
        if (t.length === 1) t = '0' + t
        s += '-' + t
        t = date.getDate().toString()
        if (t.length === 1) t = '0' + t
        s += '-' + t
        t = date.getHours().toString()
        if (t.length === 1) t = '0' + t
        s += ' ' + t
        t = date.getMinutes().toString()
        if (t.length === 1) t = '0' + t
        s += ':' + t
        t = date.getSeconds().toString()
        if (t.length === 1) t = '0' + t
        s += ':' + t
        return s
    }

    /**
     * dateFormat("YYYY-mm-dd HH:MM", date)
     * 2019-06-06 19:45`
     */
    // public static dateFormat(fmt: string, date: Date) {
    //     let ret;
    //     const opt: any = {
    //         "Y+": date.getFullYear().toString(),        // 年
    //         "m+": (date.getMonth() + 1).toString(),     // 月
    //         "d+": date.getDate().toString(),            // 日
    //         "H+": date.getHours().toString(),           // 时
    //         "M+": date.getMinutes().toString(),         // 分
    //         "S+": date.getSeconds().toString()          // 秒
    //         // 有其他格式化字符需求可以继续添加，必须转化成字符串
    //     };
    //     for (let k in opt) {
    //         ret = new RegExp("(" + k + ")").exec(fmt);
    //         if (ret) {
    //             fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
    //         };
    //     };
    //     return fmt;
    // }

}