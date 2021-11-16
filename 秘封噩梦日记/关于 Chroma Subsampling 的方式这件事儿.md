[屑站版](https://www.bilibili.com/read/cv1714795)

我之前谈到了 Chroma Subsampling 常见有 Centre Align（中心对齐）与 Left Align（靠左对齐）两种方式。那么具体来说，我们该如何处理呢？

首先我们来看 MPEG-2 4:2:0（属 Left Align）和 MPEG-1 4:2:0（属 Centre Align）的示意图。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/5e8722054707c6f7cf0c8e60bf11a1dc9a690b76.jpg)

从图中可以看出，MPEG-2 是在 2×2 区域里面取左中，而 MPEG-1 取的是正中。

那么能不能用 Centre Align 来作 Left Align 采样呢？答案是肯定的。

我们再来将之前的示意图对比一下区域。

其实我们很容易知道 Centre Align 采样后，与 Full 放入同一个参考系（坐标放大到两倍再对齐）是重合的，因为采样后的中心没有变。这我就不画了。

而 Left Align 采样后的中心发生了改变。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/e730eb1a80e8c6d3f80eca00df577f46aebc0c64.jpg)

我用叉标上了采样前后的中心。

图中可以看到 Left Align 与 Full（按 Full 来说）其实相差了 0.5 px，那么？……

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/092b127a7876b228dc48de413fee8e01e13fc407.jpg)

首先我们将 Chroma 向右移 0.5 px，然后进行 Centre Align 采样。得到的结果可以看到，布局与 Left Align 是一致的。

这启发我们用 Centre Align 的 Resizer 处理 Left Align。我们来实践一下。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/1c6eee604e6a233f7f96d562c1c241da288f1a6a.png)

这是 4:4:4 的源，如何用 MPEG-2 的方式采样成 4:2:0 呢？

首先分离 Y、U、V 三通道。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/b665a1debec43942d9af491e39cb0281d765ab38.png)

然后，对 Chroma 右移 0.5 px 后 Resize。实际上，Resizer 有参数 src_left 可以指定横向偏移。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/8dd61f1d4dfae9107e673c45c7c0b6a5e3d231ef.png)

这里指定 src_left=-0.5，就是向右偏移 0.5 px 后 Resize 了。

最后便可以合并通道了。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/23fa820a57484adc4e31c799242cde9b98928402.png)

事实上，nnedi3_resize16 内部也就是用这种方法处理 Left Align 采样的。有兴趣可以对比，结果应当是一致的。

反之我们可以对 Chroma 进行拉升，原理如图：

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/67b354acc1a0e35d6cce07540ee38334a1dbb4f2.jpg)

就是说我们只要指定 src_left=0.25，向左偏移 0.25 px 再 Resize 就好了。

看实例。

拿上次的バカ部 OP 那个简化一下吧。

首先我们以最简的手法重写。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/d3ffa6d5827e5a30efac408bf489368af1238d8a.png)

对 Chroma 进行 Resize，指定 src_left=0.25。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/06d20f3918ed4446e21bacfd33fc4da8d5361124.png)

合并通道。

![](https://raw.githubusercontent.com/mrhso/IshisashiWebsite/master/img/1ae991f9e960e1e07c00023f14666581775d0d83.png)

是不是相当简单呢？（大嘘）

所以啊，这东西关键在于要分析偏移的抵消方案，但是。

Chroma Subsampling 必须死1111111111111111111111111111111111111111111111111111111111111111111
