import { $g } from "../speed.do";
import { WXCompatible } from "./wx.compatible";

/**
 * 微信生物认证
 * 本地认证和服务器认证
 * https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/bio-auth.html
 * 微信服务器验证结果
 * POST http://api.weixin.qq.com/cgi-bin/soter/verify_signature?access_token=%access_token
 * 参数 : {"openid":"$openid", "json_string" : "$resultJSON", "json_signature" : "$resultJSONSignature" }
 * 结果为 : {"is_ok":true}
 */
export class WXSoterAuth {

    /** 是否支持指纹识别 */
    public static fingerPrint: boolean = false;
    /** 是否支持人脸识别 */
    public static facial: boolean = false;

    /** 检查设备支持什么类型的认证, 并缓存 */
    public static checkSupport(): Promise<boolean> {
        return new Promise(resolve => {
            if (!WXCompatible.canRun('1.5.0', '无法启用生物识别。')) return resolve(false)
            console.log('[WX生物认证]获取支持认证方式');
            wx.checkIsSupportSoterAuthentication({
                success(res: WechatMiniprogram.CheckIsSupportSoterAuthenticationSuccessCallbackResult) {
                    console.log('[WX生物认证]', res);
                    // res.supportMode = [] 不具备任何被SOTER支持的生物识别方式
                    // res.supportMode = ['fingerPrint'] 只支持指纹识别
                    // res.supportMode = ['fingerPrint', 'facial'] 支持指纹识别和人脸识别
                    if (res.supportMode.indexOf('fingerPrint') !== -1) {
                        console.log('[WX生物认证]支持指纹')
                        WXSoterAuth.fingerPrint = true
                    }
                    if (res.supportMode.indexOf('facial') !== -1) {
                        console.log('[WX生物认证]支持人脸')
                        WXSoterAuth.facial = true
                    }
                    if (res.supportMode.length > 0) {
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                },
                fail(e) {
                    console.log('[WX生物认证][获取支持失败]', e);
                    resolve(false)
                }
            })
        })
    }

    /**
     * 获取设备内是否录入如指纹等生物信息的接口
     * @param checkAuthMode 检测的版本
     */
    public static checkDevice(checkAuthMode: 'fingerPrint' | 'facial' | 'speech'): Promise<boolean> {
        return new Promise(resolve => {
            if (!WXCompatible.canRun('1.6.0', '无法启用生物识别。')) return resolve(false)
            console.log('[WX生物认证]获取设备支持认证方式');
            wx.checkIsSoterEnrolledInDevice({
                checkAuthMode: checkAuthMode,
                success(res: WechatMiniprogram.CheckIsSoterEnrolledInDeviceSuccessCallbackResult) {
                    console.log('[WX生物认证]', res)
                    resolve(res.isEnrolled)
                },
                fail(e) {
                    console.log('[WX生物认证][获取设备支持失败]', e);
                    resolve(false)
                }
            })
        })
    }

    /**
     * 开始 SOTER 生物认证
     * @param authModes fingerPrint 指纹,facial 人脸, speech[声纹识别（暂未支持]
     */
    public static async start(authModes: ("fingerPrint" | "facial" | "speech")[]): Promise<string | null> {
        return new Promise(resolve => {
            console.log('[WX生物认证]认证')
            wx.startSoterAuthentication({
                requestAuthModes: authModes,
                challenge: 'GaGa',
                authContent: '请用指纹解锁',
                success(res) {
                    console.log('[WX生物认证]', res)
                    let s: string = ''
                    if ($g.hasKey(res, 'resultJSON')) {
                        const o = JSON.parse(res.resultJSON)
                        $g.log('[WX生物认证]', o)
                        let s: string = ''
                        if ($g.hasKey(o, 'raw')) {
                            s += 'raw:' + o.raw + '|'
                        }
                        if ($g.hasKey(o, 'cpu_id')) {
                            s += 'cpuid:' + o.cpu_id + '|'
                        }
                        if ($g.hasKey(o, 'uid')) {
                            s += 'uid:' + o.uid
                        }
                        if (s.length) {
                            resolve(s)
                        }
                    }
                    resolve(null)
                    // wx.setClipboardData({
                    //     data: JSON.stringify(res),
                    //     success(res) {
                    //         wx.getClipboardData({
                    //             success(res) {
                    //                 console.log(res.data) // data
                    //             }
                    //         })
                    //     }
                    // })
                    /*
                    {"errMsg":"startSoterAuthentication:ok",
                    "resultJSON":"{\"raw\":\"123456\",\"counter\":12,\"uid\":\"fb5ca22e3f8f6b96fbddc6ddb88d4d8f\",\"cpu_id\":\"F8C3278B-D043-40C4-B0D3-A8CF0BBC26E9\"}",
                    "resultJSON":{"raw":"123456","counter":12,"uid":"fb5ca22e3f8f6b96fbddc6ddb88d4d8f","cpu_id":"F8C3278B-D043-40C4-B0D3-A8CF0BBC26E9"},
                    "resultJSONSignature":"TU+7UJ4l2+lbzsvA3YNmmb4M4XTVMEuFXtYWhQ8YKQWtdQeLs/P0cU9/IsSigTCKVxMW5FM6OKJiHyDEN9e9FpRZTgf013jV3tTDLhiMkwMj5OOyc5gfBBTVdX2AVaAnwPFYsNfkta4Q9veOArkGoBuTcrWMCLT4I9nwNzMl9ymLOsQYtMNwPhu+/ToPrAP3xF0xTjzkkAU24X4/SAm94t0dum6AwMXV7Bn7vRiw+XOyA1Bdrxqgf5qrutMxLmt7HFP4004ik4/LOubBQ+YpT13k//jbUN4XyJTnAvifv5bIf++ZgnrfnVIy923ITXU6bpWZQB/F7eOR5OyGxYHfNg==",
                    "authMode":"facial",
                    "errCode":0}
                    resultJSON : {
                        "raw":"msg",调用者传入的challenge
                        "fid":"2",（仅Android支持）本次生物识别认证的生物信息编号（如指纹识别则是指纹信息在本设备内部编号）
                        "counter":123,//每次都会变, 防重放特征参数
                        "tee_n":"TEE Name",TEE名称（如高通或者trustonic等）
                        "tee_v":"TEE Version",TEE版本号
                        "fp_n":"Fingerprint Sensor Name",指纹以及相关逻辑模块提供商（如FPC等）
                        "fp_v":"Fingerprint Sensor Version",指纹以及相关模块版本号
                        "cpu_id":"CPU Id" 一串编码,机器唯一识别ID
                        "uid":"21" 手机UUID,概念同Android系统定义uid，即应用程序编号
                    }
                    resultJSONSignature	string	用SOTER安全密钥对 resultJSON 的签名(SHA256 with RSA/PSS, saltlen=20)
                    bool 验签结果=verify(用于签名的原串，签名串，验证签名的公钥)
                    */
                },
                fail(e) {
                    console.log('[WX生物认证][认证失败]', e);
                    resolve(null)
                }
            })
        })
    }
}