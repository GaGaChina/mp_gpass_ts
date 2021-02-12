import { $g } from "../../frame/speed.do"

/**
 * Component 构造器可用于定义组件
 * var pageCommonBehavior = require('./page-common-behavior')
 * module.exports = Behavior({
 *     // defFields behavior 的 component/behavior 定义对象
 *     // definitionFilterArr 该 behavior 用的 behavior 的 definitionFilter 函数列表
 *     definitionFilter(defFields, definitionFilterArr) {},
 * })
 */
Component({
    /** Component 构造器可用于定义组件 */
    //behaviors: [pageCommonBehavior],
    /** 组件间关系 */
    relations: {
        /** 子组件 */
        './custom-li': {
            /** 目标节点类型,child:子节点[target子], parent:父节点[target父], ancestor:祖先节点, descendant:子孙节点 */
            type: 'child',
            /** 节点插入，target节点实例对象，在节点attached后触发 */
            linked(target) { },
            /** 节点移动，target节点实例对象，在节点moved后触发 */
            linkChanged(target) { },
            /** 节点移除，target节点实例对象，在节点detached后触发 */
            unlinked(target) { }
        }
    },
    /** 2.10.1后可以在 json 直接放置 options */
    options: {
        /** 默认一个组件只有一个 slot, true启用多slot支持 */
        multipleSlots: true,
        /**
         * 2.6.5 开始支持
         * isolated         : 组件内外样式隔离
         * apply-shared     : 页面影响组件,组件不影响页面
         * shared           : [默认]组件页面互相影响
         * page-isolated    : 页面禁用 app.wxss, 页面 wxss 不影响其他自定义组件
         * page-apply-shared: 页面禁用 app.wxss, 页面 wxss 不影响其他自定义组件，但 shared 组件影响页面
         * page-shared      : 页面禁用 app.wxss, 页面 wxss 影响其他设为 apply-shared 或 shared 组件，也会受到 shared 组件影响
         */
        styleIsolation: 'isolated',
        /** 等价 styleIsolation: apply-shared, 并忽视styleIsolation  */
        addGlobalClass: true,
        //virtualHost: true,
        /**
         * 纯数据字段,不在 wxml使用 或 传递给其他组件, 提升性能
         * 可以在 observers 被监听
         * 2.10.1 开始可以配置在json里
         * /^_/          : 所有 _ 开头数据字段
         * /^timestamp$/ : 将 timestamp 属性指定为纯数据字段
         */
        pureDataPattern: /^_/,

    },
    /** 接收外部传入的类样式 */
    externalClasses: ['my-class'],
    /** 组件属性列表 properties和data指向同对象, 可定义函数 */
    properties: {
        dataList: { type: Array, value: [] },// 多个弹出信息框, 每个组件信息为 {type:String, data:{...}}
        // dis-data='{"x":"0rpx", "y":"0rpx", "width":"750rpx", "height":"100rpx"}'
        disData: {
            type: Object,
            optionalTypes: [String],
            value: {
                x: 0, // 相对父级左上角 x 坐标
                y: 0, // 相对父级的左上角 y 坐标
                w: 0, // 相对父级的宽度, 或绝对宽度
                h: 0, // 相对父级的长度, 或绝对长度
                parentDisData: null// 父级的信息
            },
            /** 属性值变化时的回调函数(不推荐使用，而用 observers 字段更加强大且性能更好) */
            observer: function xxx(newVal, oldVal) {

            }
        },
    },
    /** 组件的内部数据 */
    data: {},
    /** 数据字段监听器，监听 setData 的 properties 和 data 变化 */
    observers: {
        'disData': function (arr12) {
            // <abc bind:showTab="showTab"></abc>
            // 父级 showTab(e){e.detail}
            this.triggerEvent('showTab', arr12);
        },
        // 在 numberA 或者 numberB 被设置时，触发一次函数
        'numberA, numberB': function (numberA, numberB) {
            this.setData({ sum: numberA + numberB })
        },
        // this.data.some 或 this.data.some.subfield 时触发
        'some.subfield': function (subfield) {
            // subfield === this.data.some.subfield
        },
        // 设置 this.data.arr 或 this.data.arr[12] 时触发
        'arr[12]': function (arr12) {
            //arr12 === this.data.arr[12]
        },
        // 设置 this.data.some 或 this.data.some.field 本身或其下任何子数据字段时触发
        'some.field.**': function (field) {
            //field === this.data.some.field
        },
        '**': function () {
            $g.log('[组件][Entry-Field]**')
        },
    },
    /** [推荐]外面声明生命周期会被这里覆盖 */
    lifetimes: {
        /** 刚被创建执行:能data,不能setData, 一般给this加属性 */
        created() {
            $g.log('[组件][view-sprite]创建', this.data);
        },
        /** 实例进入页面节点树时执行),可以setData */
        attached() { },
        /** 视图层布局完成后执行 */
        ready() { },
        /** 实例被移动到节点树另一个位置时执行 */
        moved() { },
        /** 实例被从页面节点树移除时执行 */
        detached() { },
        /** 组件方法抛出错误时执行 */
        error() { },

    },
    /** 组件所在页面的生命周期函数 */
    pageLifetimes: {
        /** 所在的页面被展示时执行 */
        show() { },
        /** 所在的页面被隐藏时执行 */
        hide() { },
        /** 所在的页面尺寸变化时执行 */
        resize(size: WechatMiniprogram.Page.IResizeOption) { },
    },
    /** 组件的方法列表 */
    methods: {
        demo() {

        }
    },
})
