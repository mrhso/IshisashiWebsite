上次文章用了些许黑话，那么我先在这里把上次出现过的解释一下：
- Chroma Subsampling：色度采样
- EP：Egg Pain（蛋疼）
- 彩虹眼：指观感差异比一般人明显。（眼瞎是福？）

问题在于我习惯用英文了，所以这次就括号注上翻译吧。

### 为何不直接用切割后的 Y？
首先我们来看两张图。

「バカ部OP（错误打开方式）.avs」代表直接用切割后的 Y 与 UV 合并后 Upscale（拉升）到 YV24，「バカ部OP.avs」代表把 UV Upscale 再与源 Y 合并。

![](https://img.vim-cn.com/8e/eb644847c5a7b83caabf5258e73cd496c7d59f.png)

![](https://img.vim-cn.com/ac/5ef959aab80e12664e6102c919f7d698abd153.png)

当然为了照顾非彩虹眼人士呢，就放大到了 400%。

注意这个「迎」字，好像不太对劲。这就是发生了 Chroma Shift（色度偏移）。

不过说实在的，即使是 100%，这也是非常明显的在我的彩虹眼的生理反应上（鲁迅式超长定语，是我日语太好了吗？谔谔）。

可以注意到，色度在左边发生溢出，右边发生亏欠，谁要是压成这样可以直接坐 Dream Express 了 QQQXX（Thank you 谢谢）。

因为这 Chroma（色度）本来就是在 755×480 采样的，你拿 754×480 的 Luma（亮度）套就不对。

### 为何不把 UV 直接拉升？
因为真的会有问题。

![](https://img.vim-cn.com/cd/b7f2b40c8a83109bc83797b3643d8d59b95712.png)

![](https://img.vim-cn.com/2e/7adeb91d8d943f8946246137e6e23f67a7a5e3.png)

那么我们要解释一下 Chroma Subsampling 到底是怎么做的。

对于 MPEG-1、JPEG 和 MJPEG 的 4:2:0 来说，采样的时候是 Centre Align（中心对齐）。

而 MPEG-2 的 4:2:0，以及 4:2:2，则都是 Left Align（靠左对齐）。

那么问题来了，我们的 Resizer（缩放滤镜）一般则是 Centre Align，若是用这样的 Resizer 去处理 Left Align 的 Chroma，势必会造成 Chroma Shift。

所以啊，Chroma Subsampling 这东西，模拟信号时代的遗留产物，跟 Interlaced 是一个道理。

然而现在数字压缩效率如此好的今天，Chroma Subsampling 反而会阻碍压缩，因为影响了数据的平均分布。

这也就是我说「Chroma Subsampling 必须死」的道理。

「mawen1250」大佬曾经画过一张处理 Left Align 的图，可以看一下。

![](https://img.vim-cn.com/5c/5363e266fe264f6a827d841ced62b520d8a820.png)

啊反正我是给看晕了。
