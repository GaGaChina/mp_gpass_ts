import { KdbxIcon } from "./kdbx.icon"

/**
 * 添加的模板配置
 * 
 * UserName : key的别名 卡号
 * pass : 密码
 * 
 * 
 * key : '银行卡号'  数字银行卡号   默认值
 *       '持卡人'    type类型
 * 
 * 模板名称 name
 * 模板类型, 文件夹 group /普通 entry
 * 字段 List
 *      Item ->   key = ''  别名 = ''  type = 类型,  默认值
 * 
 * 
 */
export class DBTemplate {

    /** 是否初始化 */
    private static init: boolean = false

    /**
     * 配置创建的类别
     */
    private static _list: Array<Object> = [
        {
            title: '组', name: 'group', type: 'group', icon: 0, list: []
        },
        {
            title: '通用', name: 'normal', type: 'entry', icon: 0, list: [
                { icon: '', key: '', keyname: '别名', type: 'string', def: '' }
            ]
        },
    ]

    public static get list(): Array<Object> {
        if (DBTemplate.init === false) {
            for (let i = 0; i < DBTemplate._list.length; i++) {
                const item: any = DBTemplate._list[i]
                item.iconstr = KdbxIcon.list[item.icon]
            }
            DBTemplate.init = true
        }
        return DBTemplate._list
    }


}