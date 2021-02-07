/** 时间类型 */
enum TimeEngineTimeType {
    useFPS = 1,
    useFrequency = 2,
    useEnterFrame = 3
}
/** 时间驱动的处于的状态类型 */
enum TimeEngineType {
    /** 以本时间驱动器的频率传递 **/
    no = 1,
    /** 运行中 **/
    run = 2,
    /** 暂停中 **/
    pause = 3
}


export class TimeEngine {
    /** */
    public time: number = 0;
    /** 内核时间,每次外部出入新时间,就会叠加进内核 **/
    private core: number = 0;
    /** 正在运行第几轮,从1开始 **/
    public round: number = 0;
    /** 时间控制器的速度 **/
    public speed: number = 1;
    /** 时间器的状态 **/
    private _type?: number;
    /** 是否已经设置过时间 **/
    private isSet: boolean = false;
    /** 本轮执行了几次循环 **/
    private _round: number = 0;
    /** 上一次执行的时间 **/
    private timePrev: number = 0;
    /** 下一次运行的时间 **/
    private timeNext: number = 0;
    /** 暂停的时间点 **/
    private timePause: number = 0;

    /** 发动机准备运行到的时间 **/
    private timeTarget: number = 0;
    /** totalRun 必须为true 否则将根据round运算出time值(未达到nextTime不会运算),还是直接叠加进入目标时间值(不会直接用带入值) **/
    private _useTarget: Boolean = false;
    /** 频率 **/
    private _fps: number = 0;
    /** 变频器的频率,毫秒,0标识EnterFrame,毫秒区间设定为±20% **/
    private _frequency: number = 0;
    /** 使用FPS还是其他类型 **/
    private _useType: number = TimeEngineTimeType.useFPS;
    /** 是否自己驱动时间 **/
    private _selfEngine: boolean = false;
    /** 自己驱动震荡频率, -1,负数为超级震荡,1为EnterFrame震荡 **/
    private _engineFPS: number = 0;
    /** 驱动器的安全值(防变速齿轮),当震荡频率超过倍数,修正为单倍震荡, 0不修复 **/
    private _engineSafe: number = 0;
    //-----------------------------------------时钟处理模块
    /** 运行函数的时候是以整体运行,还是一次次运行,重复执行函数,和单次执行,带入新加次数 **/
    private _totalRun: boolean = false;
    /** 每个帧的时候运行的函数 **/
    private enterFrameLib: Array<Function> = new Array<Function>();
    /** 有多少回调函数 **/
    private length: number = 0;
    /** 捆绑其他的时钟 **/
    //public boundType:number = TimeEngineBoundType.sameFrequency;
    public boundList?: Array<TimeEngine>;

    /** 频率 **/
    public get fps(): number { return this._fps; }
    /** 变频器的频率,毫秒,0标识EnterFrame,毫秒区间设定为±20% **/
    public get frequency(): number { return this._frequency; }
    /** 是否自己驱动时间 **/
    public get selfEngine(): Boolean { return this._selfEngine; }
    /** 自己驱动震荡频率, -1,负数为超级震荡,1为EnterFrame震荡 **/
    public get engineFPS(): Number { return this._engineFPS; }

    /**
     * 启动, 如果没有设置过,就会使用t值开始
     * @param	t	-1 取系统的 new Date().getTime()
     */
    public run(t: number = -1): void {
        
        if (this._type != TimeEngineType.run) {
            this._type = TimeEngineType.run;
            if (this.isSet == false) {
                this.isSet = true;
                this.timePrev = t == -1 ? new Date().getTime() : t;
                this.timeTarget = this.timePrev;
                this.timeNext = this.timePrev + this._frequency;
            }
            if (this._selfEngine) {
                if (this._engineFPS < 0) {
                    //g.event.addSuperEnterFrame(changeTime, this);
                } else if (this._engineFPS == 0) {
                    //g.event.addEnterFrame(changeTime, this);
                } else {
                    //g.event.addFPSEnterFrame(_engineFPS, changeTime, this);
                }
            }
        }
    }
    // 延后执行
    // setTimeout 一次、setInterval n次。 区别：setTimeout 回调后才会去调用下一次定时器，setInterval不管回调函数执行情况，当到达规定时间就会在事件队列中插入一个执行回调的事件
    // var timeoutId = window.setTimeout(setTime, 延迟时间默认0)
    // 间隔重复调用
    // var intervalId = window.setInterval(setTime, 间隔周期)
    // 浏览器结束操作后立即执行(仅IE10和Node 0.10+中有实现)，类似setTimeout(func, 0), Node中 setTimeout 更快
    // var immediateId = setImmediate(setTime)
    // 根据刷新率调用
    // var requestId = window.requestAnimationFrame(setTime)

    private setTime():void{
        var thisTime = new Date().getTime()
    }

    /** 暂停 **/
    public pause(): void {
        if (this._type != TimeEngineType.pause) {
            this._type = TimeEngineType.pause;
            this.timePause = this.time;
            if (this._selfEngine) {
                if (this._engineFPS < 0) {
                    //g.event.removeSuperEnterFrame(changeTime, this);
                } else if (this._engineFPS == 0) {
                    //g.event.removeEnterFrame(changeTime, this);
                } else {
                    //g.event.removeFPSEnterFrame(_engineFPS, changeTime, this);
                }
            }
        }
    }

    /** 把现在的时间重置为0, 循环次数也重置为0 **/
    public clear(): void {
        this.time = 0;
        this.round = 0;
        switch (this._type) {
            case TimeEngineType.run:
                break;
            case TimeEngineType.pause:
                break;
            default:
        }
    }

    /**
     * 将驱动器的运行时间和其他对象绑定起来
     * @param	obj			要去特性对象获取时间的对象
     * @param	Property	通过上面对象的某一个参数来获取时间
     */
    public boundAdd(engine: TimeEngine, sameCore: Boolean): void {
        if (engine.selfEngine == false && this.boundInTree(engine)) {
            if (this.boundList === undefined) this.boundList = new Array<TimeEngine>();
            this.boundList && this.boundList.push(engine);
        } else {
            //g.log.pushLog(this, g.logType._ErrorLog, "不能互相绑定时间控制器");
            throw new Error("不能互相绑定时间控制器");
        }
    }

    /**
     * 解除一个对象的绑定
     * @param	engine
     */
    public boundRomve(engine: TimeEngine): void {
        if (this.boundList) {
            var index: number = this.boundList.indexOf(engine);
            if (index !== -1) {
                this.boundList.splice(index, 1);
                if (this.boundList.length === 0) this.boundList = undefined;
            }
        }
    }

    /**
     * 查询一个时间对象有没有在子集或者是目录一下的地方
     * @param	engine
     * @return
     */
    public boundInTree(engine: TimeEngine): Boolean {
        if (this.boundList) {
            if (this.boundList.indexOf(engine) != -1) return true;
            var itemHave: Boolean = false;
            for (const item of this.boundList) {
                itemHave = item.boundInTree(engine);
                if (itemHave) return true;
            }
        }
        return false;
    }

    /**
     * 通过外界的输入时间来控制本时间模块,相当于绑定外面一个时间驱动器,会绕开最大帧的限制
     * @param	t	-1 取系统的 getTimer();
     */
    public changeTime(t: number = -1): void {
        if (t == -1) t = new Date().getTime();
        if (t > this.timeTarget && this._type === TimeEngineType.run) {
            if (this._engineSafe != 0 && this._frequency < (t - this.timeTarget) * this._engineSafe) {
                t = this.timeTarget + this._frequency;
            }
            this.core = (t - this.timeTarget) * this.speed + this.core;
            this.timeTarget = t;
            //运行
            if (this.core > this.timeNext) {
                //一把把新的时间传递过去
                this._round = Number((this.core - this.timePrev) / this._frequency);
                var method: Function;
                var item: TimeEngine;
                if (this._totalRun) {
                    this.timePrev = this._frequency * this._round + this.timePrev;
                    this.timeNext = this.timePrev + this._frequency;
                    //设置时间
                    if (this._useTarget) {
                        this.time = this.core;
                    } else {
                        this.time = this.timePrev;
                    }
                    //设置循环次数
                    this.round += this._round;
                    //运行函数
                    for (method of this.enterFrameLib) {
                        method(this._round);
                    }
                    //将本地时间传递进绑定时间中
                    if (this.boundList) {
                        for (item of this.boundList) {
                            item.changeTime(this.time);
                        }
                    }
                } else {
                    //重复频率的执行函数形
                    while (this._round > 0) {
                        this._round--;
                        this.timePrev = this._frequency + this.timePrev;
                        this.timeNext = this.timePrev + this._frequency;
                        //设置频率
                        this.time = ~~this.timePrev;
                        if (this._round == 0 && this._useTarget) this.time = ~~this.core;
                        //设置循环次数
                        this.round++;
                        //运行函数
                        for (method of this.enterFrameLib) {
                            method(1);
                        }
                        //将本地时间传递进绑定时间中
                        if (this.boundList) {
                            for (item of this.boundList) {
                                item.changeTime(this.time);
                            }
                        }
                    }
                }
            } else if (this._useTarget) {
                this.time = ~~this.core;
            }
        } else {
            this.timeTarget = t;
        }
    }
}