**读取偏移 = 驱动器读取坐标 - 基准系坐标 = 基准系原点 - 驱动器读取原点**

例如，驱动器的读取偏移为 +679 采样时，基准系下 0 采样处的数据将对应驱动器所给数据流的 679 采样处；或者说，从数据流的 679 采样处开始写下档案。

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

**写入偏移 = 基准系坐标 - 驱动器写入坐标 = 驱动器写入原点 - 基准系原点**

写入偏移的指向和读取偏移相反，但这是因为偏移量作用的对象是原始数据流。

例如，驱动器的写入偏移为 +50 采样时，基准系下 50 采样处的数据将会写在驱动器的 0 采样处；或者说，从输入档案的 50 采样处开始刻录数据。

**组合读/写偏移 = 读取偏移 + 写入偏移 = 驱动器读取坐标 - 驱动器写入坐标 = 驱动器写入原点 - 驱动器读取原点**

用于读取和用于写入的驱动器可以不同。

注意到基准系原点在相加时抵消了，因而组合读/写偏移是和基准系无关的量。不难理解设计意图——仅知该量便可复制 CD。

**绝对写入偏移 = AccurateRip 写入偏移 + 30 采样**

这是组合读/写偏移的不变性的直接推论。
