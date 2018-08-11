[模糊版](https://www.mohu.club/article/140)、[纸糊版](https://zhuanlan.zhihu.com/p/38680594)

### （2018 年 6 月 29 日）
既然买了 ER-X，不玩玩 IPv6 可不行啊。一般来说，内部组建 IPv6 有两种组建方案。一种是直接把公网 IP Relay 到下级，另外一种就是给设备分配 ULA 并进行 NAT。

在 IPv4 中，我们已经很熟悉 NAT 了。这次我们先谈谈 NAT6，如果有时间的话会讲 Relay。

首先把 ER-X 刷成 OpenWrt，不然 EdgeOS 人类无法驾驭。这在[《ER-X 折腾计划》](https://github.com/mrhso/IshisashiWebsite/blob/master/%E6%97%A5%E5%B8%B8/ER-X%20%E6%8A%98%E8%85%BE%E8%AE%A1%E5%88%92.md)便讲过。

实际上这次的教程可以适配任何 OpenWrt 支持的设备，不仅限于 ER-X。

要进行 IPv6 NAT，就必须安装上 kmod-ipt-nat6，而这个包 OpenWrt 不自带，所以：

```
opkg update
opkg install kmod-ipt-nat6
```

或者在 LuCI 拉取软件源，然后查找 kmod-ipt-nat6 安装：

![](https://img.vim-cn.com/13/f92a22124d0ecbb556c2dab4b4861ad90b3afc.png)

非常地简单（大嘘）

然后我们要注意，如果 LAN 的地址段属于 ULA，那么 OpenWrt 便不会公布网关，所以需要勾选：

![](https://img.vim-cn.com/f0/0fec0dfb0bb1d6c7aa2eca3e8a23ae5622fcb8.png)

那么如何开启 NAT6 呢？在防火墙的自定义规则加如下：

![](https://img.vim-cn.com/f7/3ed466cbc46e91dd4b46d0bbe6783dc970ef71.png)

```
# 定义 IPv6 WAN 接口名（Linux）
iface_linux=pppoe-wan
# 建立 IPv6 NAT
ip6tables -t nat -A POSTROUTING -o $iface_linux -j MASQUERADE
```

其中 iface_linux 便是：

![](https://img.vim-cn.com/85/24a418f6bb9b221e43e6686fda5b643ac2d025.png)

こ↑こ↓。按下「重启防火墙」保存。

但是一般我们拨号拨出来的网关是 fe80 开头的网关，所以可以在 /etc/hotplug.d/iface 建立个脚本，来自动添加路由表。

先在 /etc/hotplug.d/iface 建立 99-ipv6。当然 hotplug 的脚本其实不必 chmod +x。

脚本内容如下：

```
#!/bin/sh
[ "$ACTION" = ifup ] || exit 0
# 定义 IPv6 WAN 接口名（UCI）
iface_uci=wan_6
# 定义 IPv6 WAN 接口名（Linux）
iface_linux=pppoe-wan
[ -z "$iface_uci" -o "$INTERFACE" = "$iface_uci" ] || exit 0
ip -6 route add `ip -6 route | grep $iface_linux | grep via | sed -e 's/from [^ ]* //' | sed -e '2,$d'`
logger -t IPv6 "Add IPv6 default route."
```

iface_linux 已经讲过了，但是 iface_uci 又没讲过。其实：

![](https://img.vim-cn.com/a1/f96c89a7e60b660c95987cda206caac87f66ba.png)

但是泽个东西 LuCI 在显示的时候全部转成了大写，就会踩到大小写民感的雷。

![](https://img.vim-cn.com/ec/7ef60fc2179e937976eebcfeb3ba569e2a01b4.png)

然后看看地址栏。

![](https://img.vim-cn.com/d8/5cba7e1299b09271f2bb171eaad071969f1d10.png)

嗯，所以是小写的「wan」。那么上面的脚本为什么写「wan_6」？

因为 OpenWrt 对 PPPoE 会虚拟出一个 IPv6 接口，其 UCI 名是原本的名称后面接上「_6」。如果是 DHCPv6 客户端模式就不用加。

然后重启路由器，不出意外的话 NAT6 就成功了：

![](https://img.vim-cn.com/46/83e0f269320f8fb259f92ae81bec872248914d.png)

![](https://img.vim-cn.com/60/12fd6b60bf09691d243a15cefdf15b80460629.png)

![](https://img.vim-cn.com/73/9ea7a59d6507e12a432e5047d6561dfdc0cc10.png)

![](https://img.vim-cn.com/23/060853ac45cff4101aa3c532a42afbf3086fe2.png)

（由此还能看出电信的 IPv6 还跑到了 CERNET（教育网）……其实三大运营商的 IPv6 差不多都是）

最后看完这篇的大佬们，谢谢茄子，，，

### （2018 年 7 月 4 日）
首先要补充的是，如果地址是 ULA 的话，那么像 Android 等系统可能会优先解析 IPv4。为了避免这种情况，只好不使用 ULA 了。

但是这个地址也不能乱设，不然冲突了就不好了。所以我们从 [IANA 的 IPv6 分配表](https://www.iana.org/assignments/ipv6-address-space/ipv6-address-space.xhtml)选一个没被用的地址。

![](https://img.vim-cn.com/20/817d04362c06bdcff4f90d0f8c5f34f50b5e5a.png)

这个有 Note 的区块我们也不方便用，因为应该是有了用途的。那么我们可以瞄一个无 Note 的区块。

![](https://img.vim-cn.com/2b/eaa729f6ec3cd8dabd9b5909f6f49809ca025d.png)

这块可以有！

事实上 [OpenWrt 的帮助文档](https://openwrt.org/docs/guide-user/network/ipv6/ipv6.nat6)便是这么用的：

![](https://img.vim-cn.com/ec/6d4288411f93213b2f18914bc6fce14c8fb13b.png)

（按：d000::/4 显然属于 c000::/3 的一部分）

当然，其实我不建议滥用地址，但是迫不得已的情况下不影响到他人（冲突）就没事。

那么我来谈谈为什么要用 IPv6 NAT。

事实上，家用 IPv6 的前缀会变化。而且你也保不准会不会拿到 /128 的地址。

拿到 /128 也只好自认倒楣了。而前缀变化意味着……试想你 IPv6 上得好好的，断线重连原来的地址就失效了（

所以我的意思很明白了，，，这种情况下用 Relay 反而不太方便，，，

### （2018 年 7 月 31 日）
今天，OpenWrt 18.06.0 发布！

其实单是对比 RC2 和 RC1，LuCI 也有了明显变动。

![](https://img.vim-cn.com/12/c53d5b324bf2b172b71997b9da1599e1ff72be.png)

而且 RC2 引入的 LuCI 版本已经明确显示了虚拟的 PPPoE IPv6 接口。

![](https://img.vim-cn.com/2f/229879d2a11e38995a5f7875715a52b0539f09.png)

注意「协议：虚拟动态接口（DHCPv6 客户端）」这一点。这无疑为我们对虚拟接口的判断提供了便利。

目前我先升级了 RC2，至于正式版等待编译完毕再说吧。将在[《ER-X 折腾计划》](https://github.com/mrhso/IshisashiWebsite/blob/master/%E6%97%A5%E5%B8%B8/ER-X%20%E6%8A%98%E8%85%BE%E8%AE%A1%E5%88%92.md)持续更新。

### （2018 年 8 月 11 日）
除了安装 kmod-ipt-nat6 外，我们还可以选择安装 ip6tables-mod-nat，这样应该就能扩展 DNPT 和 SNPT 了。
