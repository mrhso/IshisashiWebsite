[模糊版](https://www.mohu.club/article/142)、[纸糊版](https://zhuanlan.zhihu.com/p/39042451)

为什么要用 DoH？DoH 是将 HTTPS 的优点融入 DNS，这样传输过程中也就不怕唐突劫持了。应对运营商的 DNS 劫持甚至某长城的 DNS 污染都特有用。

写得有点仓促，见谅。我什么都会做的。（激寒）

首先按惯例，路由器刷 OpenWrt。

安装必备的软件包，这次安装「https_dns_proxy」：

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/c97195c7de398c9d85f0b352325dd21c4b7a74ab.png)

同时我建议安装 dnsmasq-full，并去除 dnsmasq。

接下来编辑 /etc/config/https_dns_proxy，因为默认是 Google DNS，那当然不行。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/281f557fbcc1612cfea38cc763a8bdad4dd340c4.png)

将 url_prefix 修改为「https://cloudflare-dns.com/dns-query?ct=application/dns-json&」。

修改 /etc/dnsmasq.conf，加入一行「conf-dir=/etc/dnsmasq.d」，然后建立 /etc/dnsmasq.d。建立专用的 dnsmasq 配置文件夹，管理配置会很方便。

在 /etc/dnsmasq.d 放入 dns.conf，内容为「server=127.0.0.1#5053」，这样最基础的设置就完成了。

但是运营商给的 DNS 肯定也有污染啊，所以要把运营商的 DNS 干掉。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/c9ac364466df8adf4b9f2abb52f193c4dd7da489.png)

这里别勾选了罢。（激寒）

好了，运营商的 DNS 也干掉了，重启路由器。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/6de7fbf6c771d9f8737f00f8be9aa48cbcad6e63.png)

Yattaze！
