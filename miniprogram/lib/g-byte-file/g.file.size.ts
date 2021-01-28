export class GFileSize {

    
    public static getSize(len: number, decimals: number = 1): string {
        let name: string = 'byt';
        let end: number = 0;
        if (len >= 1152921504606846976) {
            name = 'e';
            end = len / 1152921504606846976;
        } else if (len >= 1125899906842624) {
            name = 'p';
            end = len / 1125899906842624;
        } else if (len >= 1099511627776) {
            name = 't';
            end = len / 1099511627776;
        } else if (len >= 1073741824) {
            name = 'g';
            end = len / 1073741824;
        } else if (len >= 1048576) {
            name = 'm';
            end = len / 1048576;
        } else if (len >= 1024) {
            name = 'k';
            end = len / 1024;
        } else {
            return len + name;
        }
        let temp: number = 1;
        for (var i: number = 0; i < decimals; i++) {
            temp = temp * 10;
        }
        end = Math.round(end * temp) / temp;
        return end + name;
    }

}