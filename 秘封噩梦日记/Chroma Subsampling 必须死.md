突然心血来潮，想压制某バカ部 OP。（李天香饼干）

惯常性用 LWLibavVideoSource 载入看，但。

![](https://img.vim-cn.com/4d/f739239626c336ad370cae8c6aa21aabd32de1.png)

于是我光速打开 MediaInfo，一窥究竟。

![](https://img.vim-cn.com/b9/47d0416565f0934d098acca2c0ea496e61c429.png)

![](https://img.vim-cn.com/1c/df983d581f8bbe079aeda35e8099fc8b371f12.png)

![](https://img.vim-cn.com/67/4010d0914dd059fc1c7f216e2ac2eb6d15481b.png)

……一方面，Chroma Subsampling 必须死；另一方面，能把 655×480 压成 4:2:2 实在也是奇妙深刻。

用 FFMS2 载入试试看。

![](https://img.vim-cn.com/2e/b36b5a8f7d605bcba44af774f2f31ed5b26dcb.png)

问题是没出，但是 Y 右边就切了一像素。我也就不言语。

但是用 YV24 载入的话 Y 是好的，UV 又被拉伸过了。我于是想到了一个聪明过分的办法。

![](https://img.vim-cn.com/4b/132a16e8a694f094b04c2442a618346fa93c4d.png)

很 EP 是不是？当然这个方法原则上是没问题的。其实还可以更 EP 点。

![](https://img.vim-cn.com/52/acb88262ad82a454c10913310d79b74078fdd8.png)

当然了，这俩方法在结果上是完全等价的。

然后把 YUV 合并。但是 Y 的宽度比 UV 两倍又多了一像素，所以要切掉。

![](https://img.vim-cn.com/d2/aa1ecf6f8001aca02ecd842ed4339d9ed6ef4b.png)

当然这切掉的最终并不采用，记作 Y′ (Derived)。

再用 nnedi3_resize 拉到 655×480 YV24。

![](https://img.vim-cn.com/0b/d8680ac9f32742f6830d05e5ef3602a71ff5f9.png)

UV 可以直接拿出来，但 Y 要在原来的 Y 升到 16-bit。

SmoothCurve16 又只支持 mod 2，所以右边加个像素再切掉。然后就可以合并 YUV 了。

![](https://img.vim-cn.com/e3/ffa666800d2e5afcf4e3214cfd667d5178b2b3.png)

不过看这左右的黑边，差不多切掉了就是 4:3 的 640×480。然而你会发现左切 7 像素右切 8 像素及反之都不合适。所以两边都切 8 像素。

那样就便乘 639×480 了，所以干脆拉回来。

![](https://img.vim-cn.com/08/05a793087ea685f96f212e40eb11fca5fe3f29.png)

Good 爽啊！

![](https://img.vim-cn.com/8d/ef0894a96bc12ec21ccd4cec899921cf7159d1.png)

但我的彩虹眼感到了生理上的不适，直觉告诉我画面很脏。把 YUV 都拉出来看看。

![](https://img.vim-cn.com/53/d1531f600678ff4451bce78ef2a54cbe4be4bc.png)

这精度令我怀疑我在看 VHS。

啊↑啊↓啊→ Chroma Subsampling 必↑须→死↓1111111111111111111111111111111111111111111111111
