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
            title: '组', name: 'group', type: 'group', icon: 48, list: []
        },
        {
            title: '通用', name: 'normal', type: 'entry', icon: 0, list: []
        },
        // {
        //     title: '银行卡', name: 'normal', type: 'entry', icon: 0, list: [
        //         { icon: '', key: '', keyname: '别名', type: 'string', def: '' }
        //     ]
        // },
        // {
        //     title: '信用卡', name: 'normal', type: 'entry', icon: 0, list: [
        //         { icon: '', key: '卡号', keyname: '', type: 'string', def: '' },
        //         /** Visa, MasterCard, China UnionPay银联, Solo */
        //         { icon: '', key: '卡片类型', keyname: '', type: 'string', def: '' },
        //         { icon: '', key: 'PIN', keyname: '', type: 'string', def: '' },
        //         { icon: '', key: '账单日', keyname: '', type: 'string', def: '' },
        //         { icon: '', key: '年费', keyname: '', type: 'string', def: '' },
        //         { icon: '', key: '年费结算日', keyname: '', type: 'string', def: '' },
        //         { icon: '', key: '还款日期', keyname: '', type: 'string', def: '' },
        //         { icon: '', key: '失效日期', keyname: '', type: 'string', def: '' }
        //     ]
        // },
        // {
        //     title: '身份证', name: 'normal', type: 'entry', icon: 9, list: [
        //         { icon: 'user', key: 'UserName', keyname: '姓名', type: 'string', def: '' },

        //     ]
        // },
        // {
        //     title: '通用', name: 'normal', type: 'entry', icon: 0, list: [
        //         { icon: '', key: '', keyname: '别名', type: 'string', def: '' }
        //     ]
        // },
        // {
        //     title: '通用', name: 'normal', type: 'entry', icon: 0, list: [
        //         { icon: '', key: '', keyname: '别名', type: 'string', def: '' }
        //     ]
        // },
        // {
        //     title: '通用', name: 'normal', type: 'entry', icon: 0, list: [
        //         { icon: '', key: '', keyname: '别名', type: 'string', def: '' }
        //     ]
        // },
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