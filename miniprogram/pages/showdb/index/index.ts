import { $g } from "../../../frame/speed.do"
import { KdbxApi } from "../../../lib/g-data-lib/kdbx.api"
import { Entry, Group, Kdbx } from "../../../lib/kdbxweb/types/index"
import { DBLib } from "../../../lib/g-data-lib/db.lib"
import { DBItem } from "../../../lib/g-data-lib/db.item"

Page({
    data: {
        fullPageHeight: 0,
        centerPageHeight: 0,
        dbEmpty: true,
        /** 现在选中的 Group */
        selectGroup: Group,
        /** 组显示内容 {uuid, icon, name, notes, } */
        groupList: new Array<any>(),
        /** 组默认的索引 index */
        groupIndex: 0,
        /** 条目内容 uuid, icon, title, username, password, isGroup  */
        itemList: new Array<any>(),
        /** 条目现在选中的索引 index */
        itemIndex: 0,
        vtabsTitle: [{ title: '标题' }, { title: '标题1' }, { title: '标题3' }]
    },
    onLoad() {
        const scene: DataScene = $g.g.app.scene
        const fullHeight: number = scene.winHeight - scene.topBarHeight - scene.topBarTop
        const centerHeight: number = fullHeight - 160
        this.setData({
            fullPageHeight: fullHeight,
            centerPageHeight: centerHeight
        })
        // 设置数据库
        const db: Kdbx | null = this.getDB()
        if (db) {
            this.setData({
                dbEmpty: KdbxApi.isEmpty(db),
            })
        }
    },
    /** 获取默认的db内容 */
    getDB(): Kdbx | null {
        const dbLib: DBLib = $g.g.dbLib
        const dbItem: DBItem | null = dbLib.selectDB
        if (dbItem?.db) return dbItem.db
        return null
    },
    setKdbx() {
        const db: Kdbx | null = this.getDB()
        this.data.groupList.length = 0
        this.data.itemList.length = 0
        if (db) {
            this.setGroup(db.groups, true)
        }
        this.setData({
            groupList: this.data.groupList,
            itemList: this.data.itemList,
        })
    },
    setGroup(groups: Group[], addGroupList: boolean = false) {
        const l: number = groups.length
        for (let i = 0; i < groups.length; i++) {
            const group: Group = groups[i]
            const groupInfo: any = {
                icon: group.icon,
                name: group.name,
                notes: group.notes,
                uuid: group.uuid
            }
            if (addGroupList) {
                this.data.groupList.push(groupInfo)
            }
            const entryInfo: any = {
                isGroup: true,
                uuid: group.uuid,
                icon: group.icon,
                title: group.name,
                username: '',
                password: ''
            }
            this.data.itemList.push(entryInfo)
            if (group.groups.length) {
                this.setGroup(group.groups, false)
            }
            if (group.entries.length) {
                for (let j = 0; j < group.entries.length; j++) {
                    const entry: Entry = group.entries[j];
                    const entryInfo: any = {
                        isGroup: false,
                        uuid: entry.uuid,
                        icon: entry.icon,
                        title: entry.fields?.Title ?? '',
                        username: entry.fields?.UserName ?? '',
                        password: entry.fields?.Password ?? ''
                    }
                    this.data.itemList.push(entryInfo)
                }
            }
        }
    },

    /** 添加一条记录 */
    btAddItem(e: any) {
        $g.log(e)
        let type: string = String(e.currentTarget.dataset.type)
        wx.navigateTo({
            url: './../add/add?type=add&infoType=bank'
        })
    },
    btEndAdd(e: any) {
        wx.navigateTo({
            url: './../add/add?type=add'
        })
    },
    btShowDbList(e: any) {
        wx.navigateTo({
            url: './../dblist/dblist'
        })
    }
})
