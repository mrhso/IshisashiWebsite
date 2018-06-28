**（2018 年 6 月 20 日：前情提要——骨干网爆炸）**

_Ishisashi_：今天国内骨干网爆炸了，IPv4 上不了维基百科。

买的支持 IPv6 的路由器还没到货，，，豆腐渣骨干网，，，

不知道骨干网要炸几天才好。

_Zenam_:电信怎么申请 v6？

_Ishisashi_：我地不用申请（就有）。

直接开启双栈，就能拨到 IPv6 地址。

_Zenam_:我在家想用。在学校天天用 v6。Youtube、打开南方卫视、看今日关注回拨……D":

_Ishisashi_：我还没上大学，没用过教育网，，，但是家用已经体验到了 IPv6 了，，，

_Zenam_:你的 v6 哪里来的。

_Ishisashi_：直接拨号就有。

_Zenam_:为啥我就没。

_Ishisashi_：240E 开头的地址，查询属于中国电信。

_Zenam_:我 2001。

D: 家用 v6 也没 ＧＦＷ!V

_Ishisashi_：校园和家用都有 DNS 污染，不过 hosts 就好。

然后买了个 Linux 的路由器。但是快递奇慢，，，北京到长沙确实也很慢吧，，，（

ER-X 好便宜，，，256 MiB 的 Flash，Debian 基础系统。

_Zenam_:Wow，还有 Linux 路由器。太消耗资源了吧。相当于数据中心/。/？比得过树莓派。

_Ishisashi_：国内售价仅 390 人民币（

淘宝还打折 339（

_Zenam_:我觉得能刷 OpenWrt 就很好了。

_Ishisashi_：能刷。

_Zenam_:是浪费，这么好的性能。

_Ishisashi_：而且这路由还有硬件 NAT。

_Zenam_:OH

硬件 NAT 和软件有啥区别 XD

_Ishisashi_：软件的吃 CPU。

_Zenam_:Oh

没区别吧。（就几台主机的话）

（可能我接触的都是企业级设备没考虑这些

_Ishisashi_：主要是如果有百兆以上宽带的话用处就非常大了，因为一般软件 NAT 没那么好性能。

_Zenam_:好吧。记得没错家用都是用 PAT 的吧，想不懂为什么会消耗这么多资源。

**（2018 年 6 月 25 日——到货）**

_Ishisashi_：我谔谔，ER-X 到叻，，，

打算在上面搞点科学上网的东西，，，

_老杨_:吇乚！

_Ishisashi_：首先看说明书，是纯英文，，，

![](https://img.vim-cn.com/c0/99ca4995654fccd0f44e81e17e3ecffa0f2927.jpg)

不过一般小白是玩不起这么高举的东西的。

这 RAM 和 Flash 算是比较大了。

![](https://img.vim-cn.com/18/992e71773a13f3904354e0fd2596f953fedac7.jpg)

eth 自然是 Linux 了，我的意思，，，

![](https://img.vim-cn.com/54/def8406a2dcfc16433b9204d126b75a6ecfa72.jpg)

_老杨_:那么是使用 IPv6 来（消音）还是使用其他方式（消音）呢？

_Ishisashi_：当然是 IPv6 了，毕竟 IPv4 之前不是物理断网了么，，，

先配置一下 IP，因为一开机肯定没有 DHCP。

![](https://img.vim-cn.com/45/b80d4d11986ae7d01085d5812be6b9dd7ed6a8.png)

打开配置页面中……

![](https://img.vim-cn.com/60/d7cdfd99ba73cfa3a53f57878537d209132738.png)

我谔谔事不信任证书，，，

![](https://img.vim-cn.com/02/b0d63aec78f7948da3bcdaf3ec4706d4574c39.png)

先登录为敬。

然后直接进行文明大脑升级，，，

![](https://img.vim-cn.com/d4/5f1c5240d40b38840bd9a5293b8e9f21064366.png)

![](https://img.vim-cn.com/8f/eb767c50af5c8e764f57c7e6735f0b6c3e7314.png)

（上传完后）

![](https://img.vim-cn.com/dd/116365bde4a2b8fee3334b671e9860eccc4237.png)

（进行网络设置中……）

_InSb Kwaku_:什么这么高举。

_Ishisashi_：然后根据一些资料，这个 EdgeOS 似乎是基于 Debian 的。

_老杨_:去他（消音）的物理断网（绝望）

基于Dabian的。（幻视）

_InSb Kwaku_:厉害。

所以说这是要做什么。

_Ishisashi_：在路由器上进行科学 XX。

_InSb Kwaku_:可以。

_Ishisashi_：所以现在需要个 Putty，这样能进行比较高举的配置。

![](https://img.vim-cn.com/2e/7e3ef684d4a5b1fcbb751a3a9d581890a1bdc0.png)

![](https://img.vim-cn.com/17/4b0da32e0c5894758c367f2a440739fddfe01c.png)

用 Excel 随机生成个 IPv6 ULA Prefix，比较公平（大嘘）

![](https://img.vim-cn.com/51/fc5f710beff301c269d6d46b890921536918de.png)

![](https://img.vim-cn.com/e2/889f2c920e7bbb8e5b2bc52328e279408d76fa.png)

（打开硬件 NAT）

**（2018 年 6 月 26 日——刷 OpenWrt）**

_Ishisashi_：当然我现在其实打算刷 OpenWrt 了，因为 EdgeOS 太高举了，玩不动（不如说是部分配置复杂到亲妈都不认识）

OpenWrt 也快支持 MT7621 的硬件 NAT 了，这样性能和 EdgeOS 其实没差（反正都是 Linux）况且想刷回来也只要一条 TTL 线就够了。

（顺便所谓「宽带绿通」我入恁娘，，，）

与其说是配置复杂，不如说根本就是表面复杂实际不完善的配置。

我就是分配个 IPv6 ULA 都没法好好分配了（DHCPv6 和 RA 当然都试过，似乎不太有效）

（不过感觉是能用才有鬼吧……毕竟官方曾经倒还明确 EdgeMax「不支持 DHCPv6 Server」，当然不知道现在的版本如何）

所以，开刷！

首先把镜像回退至原厂。

![](https://img.vim-cn.com/d7/f5b7f2419be793eac4f2c064ddac5e5f11ea98.png)

重启。为了腾出空间可以直接把升级后的镜像削除（反正那个镜像也是官网下载的，随时能下载回来）

![](https://img.vim-cn.com/f3/8df39e823b03ecd095656f18b16c04f5e322c3.png)

先在[此↑处↓](http://bbs.ubnt.com.cn/forum.php?mod=viewthread&tid=15243)准备 initramfs 的 OpenWrt 镜像作为跳板，然后刷完后把 LEDE 刷入 NAND 就好。

文件先用 SCP 传入路由。

![](https://img.vim-cn.com/7e/cdee2c287cb2f2593e7967c0b745fb6bc71462.png)

然后在 CLI 添入镜像。

![](https://img.vim-cn.com/6a/a202a2601ac837fb7670ebaedd93a40b5396c8.png)

直接重启。

本来 EdgeOS 默认是 eth0 为 LAN 的，现在就要把网线插到 eth1，因为 OpenWrt 是这样的。

原本 EdgeOS 的用户名是 ubnt，现在用 root。

![](https://img.vim-cn.com/77/6583f78d72a2e6e7ca5f4d5258820b25e33793.png)

依法炮制，用 SCP 塞入新版镜像。

然后怎么办？sysupgrade 啊。

![](https://img.vim-cn.com/60/d332c7f1eede22d6cb042157600183024ec9af.png)

虽然会报错，但是是正常现象。

噔噔咚！LEDE 出来叻，，，

![](https://img.vim-cn.com/fc/c5b8d9925055338b35264b5078b239fac3b245.png)

然后再以 LEDE 17.01.4 作为跳板，刷入 OpenWrt 18.06.0-rc1，并清空设置。

![](https://img.vim-cn.com/a9/b3e7d2fdef8708e2eba599fcd51374a1cf1fa1.png)

便乘 OpenWrt 了呢（笑）

不过按照一些资料，OpenWrt 18.06.0 将会支持 MT7621 的硬件 NAT，这波不亏（至少比起 EdgeOS 那即使使用 CLI 老亲妈都不认识的野鸡设置来说……）

然后发现 IPv6 地址分配正常了，，，

查阅一些资料，OpenWrt 应该是如此启用硬件 NAT 的：

![](https://img.vim-cn.com/c6/1aafe5e5dd01b8cefd8f3d0a3e755b7f58aa40.png)

ao！支持！威武！有希望叻！！！111111111111111111

**（2018 年 6 月 27 日——蝌穴上网）**

_Ishisashi_：顺便在路由器安装了某种软件，嗯，OC！

![](https://img.vim-cn.com/f8/b279115b489b8f7e095ab2ea66d85f3d5d4003.png)

_InSb Kwaku_:疯狂思考。

_Ishisashi_：![](https://img.vim-cn.com/55/0841394cb216c95c3559ada8ead77a901d759d.png)

竟然还够用。

![](https://img.vim-cn.com/ce/709481e38ed59c45ef5dc09b2b85362240602c.png)

![](https://img.vim-cn.com/7c/026bb57b1014150306bfe80fcd47b1bcb754c7.jpg)

_老杨_:![](https://img.vim-cn.com/7c/026bb57b1014150306bfe80fcd47b1bcb754c7.jpg)

_InSb Kwaku_:厉害了。

_Ishisashi_：![](https://img.vim-cn.com/0f/fd4746e36aed94200cc4eca12bce7bc5509d0e.png)

同时还建了本地 hosts，这样用手机都好上维基百科。

有时候我在想，我往 ER-X 刷 OpenWrt 是不是暴殄天物了（

但是就 EdgeOS 那体验来看，好像不亏，而且 OpenWrt 也快有硬件 NAT（

_羽浮风_:![](https://img.vim-cn.com/8e/981f96f7c4f04acb92875317611f3e7e89d550.jpg)

刷了 OpenWrt 之后信号变差了好多，开源驱动这个动力不够强劲。

_Ishisashi_： 反正 ER-X 是有线路由。

_羽浮风_:![](https://img.vim-cn.com/6d/e3fa28d7e6d9f6e3cee9178bc2d804c0d447c8.jpg)

没玩过。我给我的小米路由刷过很多固件，最后感觉还是老毛子固件最好了。

![](https://img.vim-cn.com/2c/adfff2a93baeef3cf445043f3e45bf12722412.gif)

然后我朋友家正好路由器坏了，我就把那个送给他用了。

_Ishisashi_：虽然之前 Zenam 倒是说过「刷 OpenWrt 浪费」这种事情……但是现在 OpenWrt 快支持硬件 NAT 了，比起 EdgeOS 来说性能不会有差。

中途刷入我用了两次跳板（其实只要用一次就够了，只不过我一开始不知道 18.06 出了 rc1）

_Zenam_:![](https://img.vim-cn.com/29/1690fa64f5e2fb6fe4f9641830a8399fbb091f.gif)

_Ishisashi_：![](https://img.vim-cn.com/79/23b05fa42d7330a771c873f996b8d23fba6d16.png)

科学上网软件有点吃内存，不过还很空余。

**（2018 年 6 月 28 日）**

_Ishisashi_：打算在模糊发表这篇文章，那么先来拍张封面罢。

![](https://img.vim-cn.com/ed/61a03d3e767e9edf290d2d4a407ffb7af60e43.jpg)

那么先讲讲配置叉叉网的经验。主要是先在电脑上配置好之后，再用 SCP 传到路由器上去。大家想放酸酸乳也可以试试，毕竟 Flash 足足有 256 MiB。

传上去之后在叉叉网目录 chmod +x start，就可以执行了。

顺便设置个开机自启动，每次开机都会自动运行叉叉网，无缝蝌穴上网。
