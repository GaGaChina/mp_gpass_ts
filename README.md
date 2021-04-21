# mp_gpass_ts / 微信小程序-密码档案

在20年底春节写的基于 KDBX 的密码账户小程序, 使用了 TypeScript, 以及组件化开发, 独立的数据模型驱动.


《密码档案》是款依托于 KDBX 开源加密格式的帐号管理小程序, 可导入导出 .kdbx 文件, 这种格式管理软件非常丰富。Kdbx 文件第一次导入, 将抽取内部的附件, 然后AES加密另存在文件夹中, 历史记录将被清除, 后面打开文件会更快!导出功能现在处于工程状态, 目前进展导出 Kdbx , XML 测试通过, 后续会增加 Excel, Word, MD, TXT等格式, 目前这个功能还未对大众开发.

可导入 KeePass 文件, 目前只支持 AES256 加密格式, 文件不要过大, 最好控制在10M内, 否则可能内存溢出闪退, 如果没附件基本没有问题.导入过程根据文件大小周期会比较长, 10M要花1分钟以上, 主要是无法调用CPU内的AES指令进行解密.

# 用到开源库:

## keeweb/kdbxweb : KeePass v2 databases (kdbx)

https://github.com/keeweb/kdbxweb.git

### Font- *Awesome*,一套绝佳的图标字体库和CSS框架

https://github.com/FortAwesome/Font-Awesome

## brix/crypto-js : JavaScript library of crypto standards

https://github.com/brix/crypto-js

## nodeca/pako : zlib port to javascript, very fast!

https://github.com/nodeca/pako

## GaGaChina/text-encoding-compress : 压缩版的字符库

https://github.com/GaGaChina/text-encoding-compress.git

