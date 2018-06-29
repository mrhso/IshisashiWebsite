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
