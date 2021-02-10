import { $g } from "../../../frame/speed.do"

// 获取应用实例
Page({
    data: {
        fullPageHeight: 0,
    },
    onLoad(options: any) {
        const scene: DataScene = $g.g.app.scene
        const fullHeight: number = scene.winHeight - scene.topBarHeight - scene.topBarTop
        this.setData({
            fullPageHeight: fullHeight,
        })
    },
})