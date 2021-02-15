import { $g } from "../../../frame/speed.do"
import { WXSoterAuth } from "../../../frame/wx/wx.soter.auth"
import { DBItem, DBLib } from "../../../lib/g-data-lib/db"
import { KdbxApi } from "../../../lib/g-data-lib/kdbx.api"
import { KdbxIcon } from "../../../lib/g-data-lib/kdbx.icon"
import { Kdbx, Group, Entry, ProtectedValue } from "../../../lib/kdbxweb/types"


/** 整个库 */
var dbLib: DBLib;
/** 默认选中的库 */
var dbItem: DBItem;
/** 默认选中的库的Kdbx */
var db: Kdbx;

Page({
    data: {
        /** 是否显示选择添加类别窗口 */
        openWinSelectType: false,
        fullPageHeight: 0,
        centerPageHeight: 0,
        findPageHeight: 0,
        dbEmpty: true,
        dbName: '',
        /** 垃圾桶的UUID */
        recycleUUID: '',
        /** 组显示内容 {uuid, icon, name, notes, } */
        groupList: new Array<any>(),
        /** 组默认的索引 index */
        groupIndex: 0,
        /** 条目内容 uuid, icon, title, username, password, isGroup, showpass  */
        itemList: new Array<any>(),
        /** 条目现在选中的索引 index */
        itemIndex: 0,
        vtabsTitle: [{ title: '标题' }, { title: '标题1' }, { title: '标题3' }],
        /** 开启人脸识别 */
        openFacial: false,
        openFacialPrint: false,

    },
    onLoad() {
        this.loadScene()
        // 设置默认的
        dbLib = $g.g.dbLib
        const select: any = dbLib.selectItem
        if (select) {
            dbItem = select
            if (dbItem.db) db = dbItem.db
            dbItem.infoRefresh = true
        }

    },
    onShow() {
        this.loadScene()
        // 如果时间超过了, 就切换回其他的页面
        if ($g.g.app.timeMouse + $g.g.app.timeMouseClose < Date.now()) {
            $g.log('[index]超时,退回登录页:', Date.now() - $g.g.app.timeMouse)
            if (dbItem && dbItem.db) dbItem.db = null
            wx.reLaunch({ url: './../../index/index' })
            return
        }
        // 设置数据库
        if (db) {
            // 清理添加的内容
            const _db: any = db
            if (dbItem.addEntry) {
                _db.move(dbItem.addEntry, null)
                dbItem.addEntry = null
            }
            // 清理添加的内容
            if (dbItem.addGroup) {
                _db.move(dbItem.addGroup, null)
                dbItem.addEntry = null
            }
            this.setData({
                dbEmpty: KdbxApi.isEmpty(db),
                dbName: dbItem.name
            })
            // $g.log('操作的库 : ', db)
            if (dbItem.infoRefresh) {
                this.setKdbx(db)
                dbItem.infoRefresh = false
            }
            // 自动开启指纹解锁和人脸解锁
            if (this.data.dbEmpty === false) {
                if (WXSoterAuth.facial) {
                    if (dbItem.pass.facial === '') {
                        if (--$g.g.app.timesShowFinger < 0) {
                            $g.g.app.timesShowFinger = 10
                            this.setData({ openFacial: true })
                        }
                    }
                } else if (WXSoterAuth.fingerPrint) {
                    if (dbItem.pass.fingerPrint === '') {
                        if (--$g.g.app.timesShowFinger < 0) {
                            $g.g.app.timesShowFinger = 10
                            this.setData({ openFacialPrint: true })
                        }
                    }
                }
            }
        }
    },
    loadScene() {
        const scene: DataScene = $g.g.app.scene
        const fullHeight: number = scene.winHeight - scene.topBarHeight - scene.topBarTop
        const centerHeight: number = fullHeight - 160
        this.setData({
            fullPageHeight: fullHeight,
            centerPageHeight: centerHeight
        })
    },
    onUnload() {
        $g.log('[page][index]清理')
        var theNull: any = null
        dbLib = theNull
        dbItem = theNull
        db = theNull
    },
    /** 获取默认打开的 Kdbx 里的列表等信息 */
    setKdbx(db: Kdbx) {
        this.data.groupList.length = 0
        this.data.itemList.length = 0
        if (dbItem.displayGroup === null) {
            const groups: Group[] = db.groups
            $g.log('添加节点信息 : ', groups[0])
            dbItem.displayGroup = groups[0]
        }
        const meta: any = db.meta
        if (meta && meta.recycleBinUuid) {
            this.data.recycleUUID = meta.recycleBinUuid.id
        } else {
            this.data.recycleUUID = ''
        }
        $g.log('回收站ID:', this.data.recycleUUID)
        this.setGroup(dbItem.displayGroup, true)
        this.setData({
            groupList: this.data.groupList,
            itemList: this.data.itemList,
        })
    },
    /**
     * 设置 组 的条目, 还有 列表条目 的列表
     * @param groups 
     * @param addGroupList 是否添加到左侧的菜单中
     */
    setGroup(group: Group, addGroupList: boolean = false) {
        // 要绕过的UUID, 一般用于垃圾桶
        let outUUID: string = ''
        if (addGroupList) {
            if (group.uuid.id) {
                dbItem.displayGroup = group
                dbItem.selectGroup = group
            }
            // 查看是否需要添加 返回上级 返回根目录
            const root: Group = $g.g.dbLib.selectItem.db.groups[0]
            if (root) {
                if (root.uuid.id === group.uuid.id) {
                    outUUID = this.data.recycleUUID
                } else {
                    this.data.groupList.push({
                        icon: KdbxIcon.list[0],
                        name: '返回根目录',
                        notes: '',
                        uuid: root.uuid.id
                    })
                }
            }
            //  查看是否有上级
            const parent: Group = group.parentGroup
            if (parent && root && root.uuid.id !== parent.uuid.id) {
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
                    // 给回收站更名
                    if (groupItem.uuid.id === this.data.recycleUUID) {
                        groupInfo['name'] = '回收站'
                    }
                    this.data.groupList.push(groupInfo)
                }
                if (groupItem.uuid.id !== this.data.recycleUUID) {
                    this.data.itemList.push({
                        isGroup: true,
                        uuid: groupItem.uuid.id,
                        icon: KdbxIcon.list[groupItem.icon],
                        title: groupItem.name,
                        username: '',
                        password: '',
                        showpass: false,
                    })
                }
                if (outUUID === '' || groupItem.uuid.id !== outUUID) {
                    this.setGroup(groupItem, false)
                }
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
            } else {
                $g.log('未找到类型, 请赶紧处理 : ' + $g.className(findItem))
                throw new Error()
            }
        } else {
            $g.log('未找到子元件')
            wx.showToast({ title: '未找到对应子节点', icon: 'none', mask: false })
        }
    },
    /** 按钮 : 展示 条目 或 组 */
    btShowUUID(e: any) {
        $g.log(e)
        let uuid: string = String(e.currentTarget.dataset.uuid)
        const root: Group = $g.g.dbLib.selectItem.db.groups[0]
        const findItem: Group | Entry | null = KdbxApi.findUUID(root, uuid);
        if (findItem) {
            const findObj: any = findItem
            if ($g.isClass(findItem, 'KdbxGroup')) {
                $g.log(`查看文件夹详情 ${uuid}`)
                wx.navigateTo({
                    url: `./../group/group?type=show&uuid=${uuid}`
                })
            } else if ($g.isClass(findItem, 'KdbxEntry')) {
                $g.log(`查看单条详情 ${uuid}`)
                wx.navigateTo({
                    url: `./../entry/entry?type=show&uuid=${uuid}`
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
    closeShowPass() {
        const l: number = this.data.itemList.length
        if (l) {
            for (let i = 0; i < l; i++) {
                const item = this.data.itemList[i];
                if (item.showpass) {
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
                if (item.uuid === uuid) return item
            }
        }
        return null
    },
    /** 按钮 : 添加一条记录 */
    btAddItem(e: any) {
        $g.g.app.timeMouse = Date.now()
        let type: string = String(e.currentTarget.dataset.type)
        wx.navigateTo({
            url: './../entry/entry?type=add&infotype=' + type
        })
    },
    /** 按钮 : 弹出添加类型界面 */
    btEndAdd(e: any) {
        this.setData({ openWinSelectType: true })
    },
    /** 按钮 : 进入仓库管理 */
    btShowDbList(e: any) {
        $g.g.app.timeMouse = Date.now()
        wx.navigateTo({ url: './../dblist/dblist' })
    },
    /** 按钮 : 进入财务系统 */
    btFinance(e: any) {
        wx.showModal({
            title: '开发中',
            content: '财报是简单快捷记录方式,已省时省力的模式进行财务归整!',
            showCancel: false
        })
    },
    /** 按钮 : 进入待办 */
    btDaily(e: any) {
        wx.showModal({
            title: '开发中',
            content: '待办系统将自动对信用卡房贷等待办事宜整理展示!',
            showCancel: false
        })
    },
    /** 按钮: 进入用户中心 */
    btUser(e: any) {
        $g.g.app.timeMouse = Date.now()
        wx.navigateTo({
            url: "./../../user/usercenter/usercenter"
        })
    },
})
