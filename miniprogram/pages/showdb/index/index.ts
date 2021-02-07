import { $g } from "../../../frame/speed.do"
import { DBItem, DBLib } from "../../../lib/g-data-lib/db"
import { KdbxApi } from "../../../lib/g-data-lib/kdbx.api"
import { KdbxIcon } from "../../../lib/g-data-lib/kdbx.icon"
import { Kdbx, Group, Entry, ProtectedValue } from "../../../lib/kdbxweb/types"

Page({
    data: {
        fullPageHeight: 0,
        centerPageHeight: 0,
        findPageHeight: 50,
        dbEmpty: true,
        dbName: '',
        /** 现在选中的 Group */
        selectGroup: null,
        /** 组显示内容 {uuid, icon, name, notes, } */
        groupList: new Array<any>(),
        /** 组默认的索引 index */
        groupIndex: 0,
        /** 条目内容 uuid, icon, title, username, password, isGroup, showpass  */
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
        const dbLib: DBLib = $g.g.dbLib
        const dbItem: DBItem | null = dbLib.selectItem
        if (dbItem && dbItem.db) {
            const db: Kdbx = dbItem.db
            this.setData({
                // dbEmpty: KdbxApi.isEmpty(db),
                dbEmpty: false,
                dbName: dbItem.name
            })
            // $g.log('操作的库 : ', db)
            this.setKdbx(db)
        }
    },
    /** 获取默认打开的 Kdbx 里的列表等信息 */
    setKdbx(db: Kdbx) {
        this.data.groupList.length = 0
        this.data.itemList.length = 0
        const groups: Group[] = db.groups
        $g.log('添加节点信息 : ', groups[0])
        this.setGroup(groups[0], true)
        this.setData({
            groupList: this.data.groupList,
            itemList: this.data.itemList,
        })
    },
    /**
     * 设置 组 的条目, 还有 列表条目 的列表
     * @param groups 
     * @param addGroupList 
     */
    setGroup(group: Group, addGroupList: boolean = false) {
        if (addGroupList) {
            // 查看是否需要添加 返回上级 返回根目录
            const root: Group = $g.g.dbLib.selectItem.db.groups[0]
            if (root && root.uuid.id !== group.uuid.id) {
                const rootInfo: any = {
                    icon: KdbxIcon.list[0],
                    name: '返回根目录',
                    notes: '',
                    uuid: root.uuid.id
                }
                this.data.groupList.push(rootInfo)
            }
            const parent: Group = group.parentGroup
            if (parent && root.uuid.id !== parent.uuid.id) {
                const parentInfo: any = {
                    icon: KdbxIcon.list[0],
                    name: '返回上级目录',
                    notes: '',
                    uuid: parent.uuid.id
                }
                this.data.groupList.push(parentInfo)
            }
        }
        let l: number = group.groups.length
        if (l) {
            for (let i = 0; i < l; i++) {
                const groupItem: Group = group.groups[i]
                if (addGroupList) {
                    const groupInfo: any = {
                        icon: KdbxIcon.list[groupItem.icon],
                        name: groupItem.name,
                        notes: groupItem.notes,
                        uuid: groupItem.uuid.id
                    }
                    this.data.groupList.push(groupInfo)
                } else {
                    const entryInfo: any = {
                        isGroup: true,
                        uuid: groupItem.uuid.id,
                        icon: KdbxIcon.list[groupItem.icon],
                        title: groupItem.name,
                        username: '',
                        password: '',
                        showpass: false,
                    }
                    this.data.itemList.push(entryInfo)
                }
                this.setGroup(groupItem, false)
            }
        }
        l = group.entries.length
        if (l) {
            for (let i = 0; i < l; i++) {
                const entry: any = group.entries[i];
                // 检测密码
                let pass: any = entry.fields?.Password
                if ($g.isClass(pass, 'ProtectedValue')) {
                    pass = '******'
                }
                const entryInfo: any = {
                    isGroup: false,
                    uuid: entry.uuid.id,
                    icon: KdbxIcon.list[entry.icon],
                    title: entry.fields?.Title ?? '',
                    username: entry.fields?.UserName ?? '',
                    password: pass,
                    showpass: false,
                }
                this.data.itemList.push(entryInfo)
            }
        }
    },
    btChangeUUID(e: any) {
        $g.log(e)
        let uuid: string = String(e.currentTarget.dataset.uuid)
        const root: Group = $g.g.dbLib.selectItem.db.groups[0]
        const findItem: Group | Entry | null = KdbxApi.findUUID(root, uuid);
        if (findItem) {
            const findObj: any = findItem
            if ($g.isClass(findItem, 'KdbxGroup')) {
                this.data.groupList.length = 0
                this.data.itemList.length = 0
                this.setGroup(findObj, true)
                this.setData({
                    groupList: this.data.groupList,
                    itemList: this.data.itemList,
                })
            } else if ($g.isClass(findItem, 'KdbxEntry')) {
                $g.log(`查看单条详情 ${uuid}`)
                wx.navigateTo({
                    url: `./../show/show?uuid=${uuid}`
                })
            } else {
                $g.log('未找到类型, 请赶紧处理 : ' + $g.className(findItem))
                throw new Error()
            }
        } else {
            $g.log('未找到子元件')
            wx.showToast({ title: '未找到对应子节点', icon: 'none', mask: false })
        }
    },
    btShowPass(e: any) {
        let uuid: string = String(e.currentTarget.dataset.uuid)
        const objItem: any = this.getItemList(uuid)
        if (objItem) {
            if (objItem.showpass) {
                objItem.password = '******'
                objItem.showpass = false
                this.setData({
                    itemList: this.data.itemList
                })
            } else {
                const root: Group = $g.g.dbLib.selectItem.db.groups[0]
                const findItem: Group | Entry | null = KdbxApi.findUUID(root, uuid);
                if (findItem && $g.isClass(findItem, 'KdbxEntry')) {
                    const item: Entry = findItem as Entry
                    const pass: any = item.fields.Password
                    if ($g.isClass(pass, 'ProtectedValue')) {
                        this.closeShowPass()
                        const pv: ProtectedValue = pass as ProtectedValue
                        objItem.password = pv.getText()
                        objItem.showpass = true
                        this.setData({
                            itemList: this.data.itemList
                        })
                    }
                }
            }
        }
    },
    /** 将现在开启的密码关闭, 但不刷新界面 */
    closeShowPass(){
        const l:number = this.data.itemList.length
        if(l){
            for (let i = 0; i < l; i++) {
                const item = this.data.itemList[i];
                if(item.showpass){
                    item.showpass = false
                    item.password = '******'
                }
            }
        }
    },
    getItemList(uuid: string): object | null {
        const l: number = this.data.itemList.length
        if (l) {
            for (let i = 0; i < l; i++) {
                const item = this.data.itemList[i]
                if (item.uuid === uuid) {
                    return item
                }
            }
        }
        return null
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
