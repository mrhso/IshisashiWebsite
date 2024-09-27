## 读取相关
**读取偏移 = 驱动器读取坐标 - 基准系坐标 = 基准系原点 - 驱动器读取原点**

例如，驱动器的读取偏移为 +679 采样时，基准系下 0 采样处的数据将会出现在驱动器所给数据流的 679 采样处。

**AccurateRip 系原点 = +30 采样**

Plextor 生产的一部分驱动器遵循完全无偏的读取原则，这批驱动器在 AccurateRip 数据库中有着 +30 采样的读取偏移。

对此可以参考 [Club MyCE 的相关讨论](https://web.archive.org/web/20150620033909/http://club.myce.com/f61/offsets-handling-syncing-audio-data-vs-q-channel-111913/index3.html)。

```
I've talked to Richard Wall, Technical Suport Manager
(http://www.dcainc.com/news/index.html#wall) at DCA
(Doug Carson and Associates),
THE optical disc encoder company (www.dcainc.com), he allowed me
to disclose about the offset experiment: he prepared a DDP file
(Disc Descriptor Protocol) where 1st byte of 00: 02.00 was !00
and encoded it for me in a MIS VIII encoder
(http://www.dcainc.com/products/MIS/MIS_V8/), then captured analog
response from LBR (Laser Beam Recorder) in a raw reading file, discovering
encoder places main channel's 1st byte aligned into channel frame 00: 02.00,
then came genial Mr. Sidney Cadot (http://ch.tudelft.nl/~sidney/)
with his audio readout system (http://club.cdfreaks.com/showthread.php?t=111913 ),
made with an old Plextor drive which precisely returns such !00 when asked
for 00:02.00, Then I concluded when I saw such drive in Wiethoff's database
having a +30 samples offset correction.

Please feel free now to disclose and quote me in forums so people gets convinced.

Regards, Carlos Hernández, PerfectRip project.
```

因而有：

+30 采样 = AccurateRip 系原点 - 绝对原点

这说明 AccurateRip 的基准点实际上在 30 采样处。

**绝对读取偏移 = AccurateRip 读取偏移 - 30 采样**

列式：

绝对读取偏移 = 绝对原点 - 驱动器读取原点

AccurateRip 读取偏移 = AccurateRip 系原点 - 驱动器读取原点

绝对原点 = 0

AccurateRip 系原点 = +30 采样

前两式相减，代入后两式，得：

绝对读取偏移 - AccurateRip 读取偏移 = 0 - 30 采样

移项整理即为所求。

## 写入相关
**组合读/写偏移 = 读取偏移 + 写入偏移**
