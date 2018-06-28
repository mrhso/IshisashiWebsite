Ishisashi：我谔谔，ER-X 到叻，，，

打算在上面搞点科学上网的东西，，，

老杨：吇乚！

Ishisashi：首先看说明书，是纯英文，，，

![](https://img.vim-cn.com/c0/99ca4995654fccd0f44e81e17e3ecffa0f2927.jpg)

不过一般小白是玩不起这么高举的东西的。

这 RAM 和 Flash 算是比较大了。

![](https://img.vim-cn.com/18/992e71773a13f3904354e0fd2596f953fedac7.jpg)

eth 自然是 Linux 了，我的意思，，，

![](https://img.vim-cn.com/54/def8406a2dcfc16433b9204d126b75a6ecfa72.jpg)

老杨：那么是使用 IPv6 来（消音）还是使用其他方式（消音）呢？

Ishisashi：当然是 IPv6 了，毕竟 IPv4 之前不是物理断网了么，，，

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

InSb Kwaku：什么这么高举。

Ishisashi：然后根据一些资料，这个 EdgeOS 似乎是基于 Debian 的。

老杨：去他（消音）的物理断网（绝望）

基于Dabian的。（幻视）

InSb Kwaku：厉害。

所以说这是要做什么。

Ishisashi：在路由器上进行科学 XX。

InSb Kwaku：可以。

Ishisashi：所以现在需要个 Putty，这样能进行比较高举的配置。

![](https://img.vim-cn.com/2e/7e3ef684d4a5b1fcbb751a3a9d581890a1bdc0.png)

![](https://img.vim-cn.com/17/4b0da32e0c5894758c367f2a440739fddfe01c.png)

用 Excel 随机生成个 IPv6 ULA Prefix，比较公平（大嘘）

![](https://img.vim-cn.com/51/fc5f710beff301c269d6d46b890921536918de.png)

![](https://img.vim-cn.com/e2/889f2c920e7bbb8e5b2bc52328e279408d76fa.png)

（打开硬件 NAT）

当然我现在其实打算刷 OpenWrt 了，因为 EdgeOS 太高举了，玩不动（不如说是部分配置复杂到亲妈都不认识）

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

顺便在路由器安装了某种软件，嗯，OC！

![](https://img.vim-cn.com/f8/b279115b489b8f7e095ab2ea66d85f3d5d4003.png)

InSb Kwaku：疯狂思考。

Ishisashi：![](https://img.vim-cn.com/55/0841394cb216c95c3559ada8ead77a901d759d.png)

竟然还够用。

![](https://img.vim-cn.com/ce/709481e38ed59c45ef5dc09b2b85362240602c.png)

![](https://img.vim-cn.com/7c/026bb57b1014150306bfe80fcd47b1bcb754c7.jpg)

老杨：![](https://img.vim-cn.com/7c/026bb57b1014150306bfe80fcd47b1bcb754c7.jpg)

InSb Kwaku：厉害了。

Ishisashi：![](https://img.vim-cn.com/0f/fd4746e36aed94200cc4eca12bce7bc5509d0e.png)

同时还建了本地 hosts，这样用手机都好上维基百科。

有时候我在想，我往 ER-X 刷 OpenWrt 是不是暴殄天物了（

但是就 EdgeOS 那体验来看，好像不亏，而且 OpenWrt 也快有硬件 NAT（

羽浮风：![](https://img.vim-cn.com/8e/981f96f7c4f04acb92875317611f3e7e89d550.jpg)

刷了 OpenWrt 之后信号变差了好多，开源驱动这个动力不够强劲。

Ishisashi： 反正 ER-X 是有线路由。

羽浮风：![](https://img.vim-cn.com/6d/e3fa28d7e6d9f6e3cee9178bc2d804c0d447c8.jpg)

没玩过。我给我的小米路由刷过很多固件，最后感觉还是老毛子固件最好了。

![](https://img.vim-cn.com/2c/adfff2a93baeef3cf445043f3e45bf12722412.gif)

然后我朋友家正好路由器坏了，我就把那个送给他用了。

Ishisashi：虽然之前 Zenam 倒是说过「刷 OpenWrt 浪费」这种事情……但是现在 OpenWrt 快支持硬件 NAT 了，比起 EdgeOS 来说性能不会有差。

中途刷入我用了两次跳板（其实只要用一次就够了，只不过我一开始不知道 18.06 出了 rc1）

Zenam：![](https://img.vim-cn.com/29/1690fa64f5e2fb6fe4f9641830a8399fbb091f.gif)

Ishisashi：打算在模糊发表这篇文章，那么先来拍张封面罢。

![](https://img.vim-cn.com/ed/61a03d3e767e9edf290d2d4a407ffb7af60e43.jpg)
