### waifu2x 是什么？
ワイフ（waifu）是外来词，词源为英语的 wife。

那么就是说，这是把你的纸片人老婆放大到原来的两倍的算法。

当然，现在不止能放大纸片人就是，对于现实影像也有一套训练数据。

那么，开始罢。

首先现在对 VapourSynth 有两套主要的滤镜，一套是 [waifu2x-caffe](https://github.com/HomeOfVapourSynthEvolution/VapourSynth-Waifu2x-caffe)，另一套是 [waifu2x-w2xc](https://github.com/HomeOfVapourSynthEvolution/VapourSynth-Waifu2x-w2xc)。

当然我们知道，家里要有矿才玩得起，因为 GPU 是决定放大速率的关键因素……

我买不起 N 卡（笑），所以用 waifu2x-w2xc 演示。

首先我拿出上次压バカ部 OP 的脚本作为演示素材。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/81224fdc87482faca218e7abc4990b853e0fc260.png)

图上可以看出，我在脚本最后把 YUV 转到了 RGB。

因为我们认为，waifu2x 在 YUV 下不如 RGB 要好。

那么这是 AVS（AviSynth），主要做的是 YUV→RGB。

然后我们就切到 VS（VapourSynth）了。首先我们在 VS 输入之前的脚本。这个要加好 vsavsreader。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/6539117e30406fe0d10e6649abd0a7c610b1aa79.png)

然后我们把 8-bit RGB 转到 32-bit Float RGB，因为 w2xc 只支持 32 位浮点输入。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/594190178cb7dff8a4ce3f32b87899fbe5a9213a.png)

不过我们要知道，VS 不像 AVS 那样有 Last 传递，而且随时要注意赋值。因为这是基于屁眼通红……啊……Python 的。

之后便是调用 waifu2x 了。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/6210b26f3ee2a6d72bde8f51661cb0e3a8338620.png)

再转回 8-bit RGB。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/bd70b61de9464f2a552e7926ba0d17143c20180f.png)

之后我们按下 F5，就能看到预览了。VapourSynth Editor 毕竟和 AvsPmod 还是不太一样。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/f6bce983e1c9652196d848df88da6f2ca31f0520.png)

……不过啊我总感觉 waifu2x anime style art 稍微有点油画感（心理作用？），photo 试试看？毕竟 anime style art 严格来说是用于插画的，photo 其实也可以用于二刺猿。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/2e1e831ed242ce822895a1ea577a0118a327288e.png)

因为我用的是 waifu2x-w2xc，所以是指定 photo=True。waifu2x-caffe 则指定 model=2。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/be05738f7dce78e6afdb4ddeed6f5ca41b10eaf8.png)

photo 的话油画感就没那么重，当然其实也差不多。但噪点就明显了。当然降噪厉害的话肯定油画感又上来了，啊。

所以说是画面太干净了才有油画感吗……噪点掩盖了油画感？

这样一比来，还是 anime style art 好些吗 www

我拿张照片试了，感觉结果相差也不是很大。其实拿张照片用 anime style art 的话好像油画感也没以前那么大的样子。

所以这也可以说明 waifu2x 在进步啊，初版油画感是很重的呢 www

可以送去压制了。当然，x264 tMod 的 VS 输入也是调用 AVS 的，所以 AVS 中要有 VSImport。当然我建议先出 8-bit RGB 无损，然后再压 10-bit YCgCo 有损。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/3336a38ad3de20fd5730fd0d2859115b9401a6d0.png)

速度感人。攒钱买 N 卡罢 www
