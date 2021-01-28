export class ToolTime {

    /**
     * 获取时间的00:00:00 000
     * @param date 时间
     */
    public static getTimesString(date: Date = new Date()): string {
        const h: number = date.getHours();
        const m: number = date.getMinutes();
        const s: number = date.getSeconds();
        const mm: number = date.getMilliseconds();
        let str: string = String(h < 10 ? '0' : '') + String(h);
        str += String(m < 10 ? ':0' : ':') + String(m);
        str += String(s < 10 ? ':0' : ':') + String(s);
        str += String(mm < 10 ? ' 00' : mm < 100 ? ' 0' : ' ') + String(mm);
        return str;
    }
}