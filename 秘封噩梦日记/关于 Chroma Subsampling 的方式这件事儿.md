我之前谈到了 Chroma Subsampling 常见有 Center Align（中心对齐）与 Left Align（靠左对齐）两种方式。那么具体来说，我们该如何处理呢？

首先我们来看 MPEG-2 4:2:0 和 MPEG-1 4:2:0 的示意图。

![](https://img.vim-cn.com/71/cae4a6b31ca33c666329a703bc11e629c2bc0a.jpg)

从图中可以看出，MPEG-2 是在 2×2 区域里面取左中，而 MPEG-1 取正中。

图中我也用虚线标出了采样前后的相对位置。

那么能不能用 Center Align 来作 Left Align 采样呢？答案是肯定的。

图中可以看到 Left Align 与 Center Align 相差 0.5 px，那么？……

![](https://img.vim-cn.com/a9/0d3a6c300d407ce2614095fcc60e22f179a964.jpg)

首先我们将 Chroma 向右移 0.5 px，然后进行 Center Align 采样。得到的结果（以采样为中心点）可以看到，布局与 Left Align 是一致的。

这启发我们用 Center Align 的 Resizer 处理 Left Align。我们来实践一下。

![](https://img.vim-cn.com/b1/a3880c201cef8b6fc3e106e0c59840985ae2cc.png)

这是 4:4:4 的源，如何用 MPEG-2 的方式采样成 4:2:0 呢？

首先分离 Y、U、V 三通道。

![](https://img.vim-cn.com/f9/d4b7f537a46e7623338e2fb386baf63aae01ed.png)

然后，对 Chroma 右移 0.5 px 后 Resize。实际上，Resizer 有参数 src_left 可以指定横向偏移。

![](https://img.vim-cn.com/3e/0d297713cef624c1e4ba1bbae96930e3b71ce1.png)

这里指定 src_left=-0.5，就是向右偏移 0.5 px 后 Resize 了。

最后便可以合并通道了。

![](https://img.vim-cn.com/00/5cee938ac8c05124b74f4ecf9c9131c3647f08.png)

事实上，nnedi3_resize16 内部也就是用这种方法处理 Left Align 采样的。有兴趣可以对比，结果应当是一致的。

反之我们可以对 Chroma 进行拉升，原理如图：

![](https://img.vim-cn.com/9a/2f48543479f2bc6e64345def65cffa29b13a83.jpg)

就是说我们只要指定 src_left=0.25，向左偏移 0.25 px 再 Resize 就好了。

看实例。

拿上次的バカ部 OP 那个简化一下吧。

首先我们以最简的手法重写。

![](https://img.vim-cn.com/4a/8405cfaf1f03b389f7ad66232ff8e379df78cf.png)

对 Chroma 进行 Resize，指定 src_left=0.25。

![](https://img.vim-cn.com/b7/55a7178cc93fedca80dab22b90aaf9f85d5989.png)

合并通道。

![](https://img.vim-cn.com/1e/66f46eeeb8c18edf2a5898708b60e27a40bddf.png)

是不是相当简单呢？

所以啊，这东西关键在于要分析偏移的抵消方案，但是。

Chroma Subsampling 必须死1111111111111111111111111111111111111111111111111111111111111111111

时间太晚了所以草草写完了事，若不详细以后写备考吧。
