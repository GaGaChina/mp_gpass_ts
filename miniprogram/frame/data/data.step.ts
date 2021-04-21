export class DataStep {

    /** 条目的条目 */
    public list: Array<DataStepItem> = new Array<DataStepItem>()
    /** 现在正在进行的 */
    public index: number = 0
    /** 现在正在进行的大步进器的小的 */
    public indexMin: number = 0

    /** 步进器修改后的回调函数 */
    public method: Function | null = null

    /** 清理全部的记录, 并关闭 */
    public async clear(): Promise<any> {
        this.index = 0
        this.indexMin = 0
        this.list.length = 0
        return await this.runMethod()
    }

    /**
     * 添加一条记录
     * @param title 条目的内容
     * @param index 插入的索引点, -1 就是在末尾插入
     */
    public add(title: string, index: number = -1): DataStepItem {
        const item: DataStepItem = new DataStepItem()
        item.title = title
        if (index === -1) {
            this.list.push(item)
        } else {
            this.list.splice(index, 0, item)
        }
        return item
    }

    /** 插入并跳转 ( 加一个 next 一个 ) */
    public async inJump(...title: Array<string>): Promise<DataStepItem> {
        const addlist: Array<DataStepItem> = new Array<DataStepItem>()
        for (let i = 0; i < title.length; i++) {
            const t: string = title[i]
            const item: DataStepItem = new DataStepItem()
            item.title = t
            addlist.push(item)
        }
        let l: number = this.list.length
        if (l - 1 <= this.index) {
            l = this.list.length
            this.list.push(...addlist)
        } else {
            this.list.splice(this.index, 0, ...addlist)
            l = this.index + 1
        }
        await this.jump(l)
        return addlist[0]
    }

    /**
     * 在当前条目的后面添加并跳转到这个条目
     * @param title 要加入的小条目
     * @param key 如果有key, 那么需要本节点的key刚好是key才能添加成功
     */
    public async inJumpSmall(title: string, key: string = ''): Promise<any> {
        if (this.list.length) {
            const item: DataStepItem = this.list[this.index]
            if (key === '' || item.key === key) {
                const add: DataStepItemSmall = new DataStepItemSmall()
                add.title = title
                let index: number = item.smallList.length
                if (index - 1 <= this.indexMin) {
                    index = item.smallList.length
                    item.smallList.push(add)
                } else {
                    item.smallList.splice(this.indexMin, 0, add)
                    index = this.indexMin + 1
                }
                await this.jumpSmall(index)
            }
        }
        return void 0
    }

    /** 切换到特定的条目 */
    public async jump(index: number): Promise<any> {
        this.index = index
        this.indexMin = 0
        return await this.runMethod()
    }

    /** 切换到特定的条目的小条目 */
    public async jumpSmall(index: number): Promise<any> {
        this.indexMin = index
        return await this.runMethod()
    }

    /** 切入下一个步进器 */
    public async next(): Promise<any> {
        this.index++
        this.indexMin = 0
        return await this.runMethod()
    }

    /** 切入小的步进器 */
    public async nextMin(): Promise<any> {
        this.indexMin++
        return await this.runMethod()
    }

    /** 出错的时候显示 */
    public async hitErr(err: string): Promise<any> {
        const step: DataStepItem = this.list[this.index]
        if (step.smallIndex === -1) {
            step.err = err
        } else {
            const small: DataStepItemSmall = step.smallList[step.smallIndex]
            small.err = err
        }
        return await this.runMethod()
    }

    /** 自动运行回调函数 */
    public async runMethod(): Promise<any> {
        if (this.method !== null) {
            return await this.method()
        } else {
            return Promise.resolve()
        }
    }
}

/**
 * 步进器的小条目
 */
export class DataStepItem {

    /** 特殊key值 */
    public key: string = ''
    /** 标题 */
    public title: string = ''
    /** 如果出错就把错误填到这里 */
    public err: string = ''
    /** 正在运行的时候的图标 */
    public iconRun: string = 'play-circle-o'
    /** 完成的时候的图标 */
    public iconFinish: string = 'check-circle-o'
    /** 在等待中的图标 */
    public iconWait: string = 'clock-o'
    /** 错误的时候的图标 */
    public iconErr: string = 'exclamation-circle'
    /** 是否开启百分比 */
    public startProgress: boolean = false
    public progress: number = 0;
    public total: number = 100;
    /** 小标签那个亮起 */
    public smallIndex: number = 0
    /** 小的节点标题 */
    public smallList: Array<DataStepItemSmall> = new Array<DataStepItemSmall>()

    /** 添加一条记录 */
    public add(title: string): DataStepItemSmall {
        const item: DataStepItemSmall = new DataStepItemSmall()
        item.title = title
        this.smallList.push(item)
        return item
    }
}

/** 小条目信息模块 */
export class DataStepItemSmall {
    /** 标题 */
    public title: string = ''
    /** 如果出错就把错误填到这里 */
    public err: string = ''
    /** 是否开启百分比 */
    public startProgress: boolean = false
    public progress: number = 0;
    public total: number = 100;
}