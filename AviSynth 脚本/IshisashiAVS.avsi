# Ishisashi 制作的 AviSynth 快捷脚本
# 直接依赖：[O16 (Ishisashi mod)](https://www.nmm-hd.org/newbbs/viewtopic.php?t=1017)、[Dither tools (Ishisashi mod)](https://forum.doom9.org/showpost.php?p=1386559)、[nnedi3_resize16](https://www.nmm-hd.org/newbbs/viewtopic.php?t=1117)、[flash3kyuu_deband](https://www.nmm-hd.org/newbbs/viewtopic.php?t=239)、[SmoothAdjust](https://forum.doom9.org/showthread.php?t=154971)
# 直接依赖的依赖自己去找，QQQXX。
# 在同时有 AviSynth 和 AviSynth+ 不同实现方案的情况下，「26」为 AviSynth 2.6 通用版函数，「Plus」为 AviSynth+ 专用版函数，效率可能比通用版更高。
# 实际使用中已能通过 IsAVSPlus 自动判断。
# 对 AviSynth 不可用而 AviSynth+ 可用的情况（如原生 High Bit-Depth），为简便，未标有「Plus」。

Function RGB2YUV(clip input, string "matrix", bool "tv_range", bool "lsb", string "output", int "dither", float "kr", float "kg", float "kb")
{
    matrix   = Default(matrix, "YCgCo")                             # 个人喜欢使用 YCgCo，所以就这样设定了。
    tv_range = Default(tv_range, False)                             # PC Range 也是同理。
    lsb      = Default(lsb, True)                                   # 设置为 True 就是 16-bit，False 就是 8-bit。
    dither   = tv_range ? Default(dither, -3) : Default(dither, 50) # 降至 8-bit 的抖动算法，默认情况对 TV Range 是用的 Floyd-Steinberg dithering，PC Range 的 Dither 带有 Random Noise。参见 O16 的 Down10。
    output   = Default(output, "YV24")                              # 当然不建议用这个设定 YV12，更建议用 nnedi3 降一下。

    return lsb ? input.Dither_convert_rgb_to_yuv(matrix=matrix, tv_range=tv_range, lsb=True, mode=-1, ampn=0, output=output, kr=kr, kg=kg, kb=kb)
    \          : input.Dither_convert_rgb_to_yuv(matrix=matrix, tv_range=tv_range, lsb=True, mode=-1, ampn=0, output=output, kr=kr, kg=kg, kb=kb).Down10(depth=8, TVrange=tv_range, dither=dither)
}

Function YUV2RGB(clip input, string "matrix", bool "tv_range", bool "lsb", string "output", float "kr", float "kg", float "kb")
{
    matrix   = Default(matrix, "YCgCo")
    tv_range = Default(tv_range, False)
    lsb      = Default(lsb, True)
    output   = Default(output, "rgb24")

    return output == "rgb32" ? input.Dither_convert_yuv_to_rgb(matrix=matrix, tv_range=tv_range, lsb_in=lsb, mode=-1, ampn=0, output=output, kr=kr, kg=kg, kb=kb).ResetMask()
    \                        : input.Dither_convert_yuv_to_rgb(matrix=matrix, tv_range=tv_range, lsb_in=lsb, mode=-1, ampn=0, output=output, kr=kr, kg=kg, kb=kb)
}

Function YUV2RGB24(clip input, string "matrix", bool "tv_range", bool "lsb", float "kr", float "kg", float "kb")
{
    matrix   = Default(matrix, "YCgCo")
    tv_range = Default(tv_range, False)
    lsb      = Default(lsb, True)

    return input.YUV2RGB(matrix=matrix, tv_range=tv_range, lsb=lsb, output="rgb24", kr=kr, kg=kg, kb=kb)
}

Function YUV2RGB32(clip input, string "matrix", bool "tv_range", bool "lsb", float "kr", float "kg", float "kb")
{
    matrix   = Default(matrix, "YCgCo")
    tv_range = Default(tv_range, False)
    lsb      = Default(lsb, True)

    return input.YUV2RGB(matrix=matrix, tv_range=tv_range, lsb=lsb, output="rgb32", kr=kr, kg=kg, kb=kb)
}

# C16 AviSynth 2.6 版。
Function C1626(clip input)
{
    return input.Dither_out()
}

# C16 AviSynth+ 版。
Function C16Plus(clip input)
{
    Assert(IsAVSPlus(), "AviSynth+ only!")

    return input.ConvertFromStacked().ConvertToDoubleWidth()
}

# unC16 AviSynth 2.6 版。
Function unC1626(clip input)
{
    return input.f3kdb(Y=0, Cb=0, Cr=0, grainY=0, grainC=0, keep_tv_range=False, input_mode=2, output_mode=1)
}

# unC16 AviSynth+ 版。
Function unC16Plus(clip input)
{
    Assert(IsAVSPlus(), "AviSynth+ only!")

    return input.ConvertFromDoubleWidth().ConvertToStacked()
}

# 将 C16 逆向，即是说把交织（Interleaved）转为层叠（Stacked）。
Function unC16(clip input)
{
    return IsAVSPlus() ? input.unC16Plus()
    \                  : input.unC1626()
}

# 这个是从 RGB 输出喂给 x264 的 10-bit Interleaved YUV 的函数。
# 实践发现 AviSynth+ 内置转换，不先升 16-bit 精度还是不够高，而且更关键的是没 YCgCo。所以仍旧用 Dither tools 转换。
Function x264(clip input, string "matrix", bool "tv_range", string "output", int "dither", float "kr", float "kg", float "kb")
{
    matrix   = Default(matrix, "YCgCo")
    tv_range = Default(tv_range, False)
    dither   = Default(dither, -1)
    output   = Default(output, "YV24")

    return tv_range ? input.RGB2YUV(matrix=matrix, tv_range=tv_range, output=output, kr=kr, kg=kg, kb=kb).SmoothCurve16(Ycurve="0-64;4096-64;60160-940;65535-940", Ucurve="0-64;4096-64;61440-960;65535-960", Vcurve="0-64;4096-64;61440-960;65535-960", mode=0, interp=0, HQ=False, dither=dither, limiter=False, TVrange=0).C16()
    \               : input.RGB2YUV(matrix=matrix, tv_range=tv_range, output=output, kr=kr, kg=kg, kb=kb).SmoothCurve16(Ycurve="0-0;65535-1023", Ucurve="0-0.5;0.5-0.5;32768-512;65535-"+String((65535-32768) / (65535.5-32768) * (1023.5-512) + 512), Vcurve="0-0.5;0.5-0.5;32768-512;65535-"+String((65535-32768) / (65535.5-32768) * (1023.5-512) + 512), mode=0, interp=0, HQ=False, dither=dither, limiter=False, TVrange=0).C16()
    # return input.RGB2YUV(matrix=matrix, tv_range=tv_range, output=output, kr=kr, kg=kg, kb=kb).Down10(depth=10, TVrange=tv_range, dither=dither).C16()
    # O16 的位深转换疑似有问题，解决前还是手写 SmoothCurve 比较好。
}

# 解码 10-bit Interleaved YUV 到 RGB。
Function unx264(clip input, string "matrix", bool "tv_range", string "output", int "dither", float "kr", float "kg", float "kb")
{
    matrix   = Default(matrix, "YCgCo")
    tv_range = Default(tv_range, False)
    dither   = Default(dither, -1)      # 这个 Dither 到底有什么用，我暂且蒙在鼓里。
    output   = Default(output, "rgb24")

    return tv_range ? input.unC16().SmoothCurve16(Ycurve="0-4096;64-4096;940-60160;65535-60160", Ucurve="0-4096;64-4096;960-61440;65535-61440", Vcurve="0-4096;64-4096;960-61440;65535-61440", mode=0, interp=0, HQ=False, dither=dither, limiter=False, TVrange=0).YUV2RGB(matrix=matrix, tv_range=tv_range, output=output, kr=kr, kg=kg, kb=kb)
    \               : input.unC16().SmoothCurve16(Ycurve="0-0;1023-65535;65535-65535", Ucurve="0-0.5;0.5-0.5;512-32768;1023.5-65535.5;65535-65535.5", Vcurve="0-0.5;0.5-0.5;512-32768;1023.5-65535.5;65535-65535.5", mode=0, interp=0, HQ=False, dither=dither, limiter=False, TVrange=0).YUV2RGB(matrix=matrix, tv_range=tv_range, output=output, kr=kr, kg=kg, kb=kb)
    # return input.unC16().BitDepth(input_depth=10, output_depth=16, input_TVrange=tv_range, output_TVrange=tv_range, dither=dither).YUV2RGB(matrix=matrix, tv_range=tv_range, output=output, kr=kr, kg=kg, kb=kb)
}

# 将 RGB32 透明 Clip 制作成 Alpha Stack。
Function AlphaStack(clip input)
{
    return StackVertical(input, ShowAlpha(input)).ResetMask()
}

# 将 Alpha Stack 解译为 RGB32。
Function unAlphaStack(clip input)
{
    input = PixelType(input) == "RGB24" ? input.ConvertToRGB32()
    \                                   : input

    return Mask(Crop(input, 0, 0, -0, -Height(input)/2), Crop(input, 0, Height(input)/2, -0, -0))
}

# 对 RGB32 透明 Clip 添加纯色背景。
Function Background(clip input, int "color")
{
    color = Default(color, $000000)

    return Layer(BlankVideo(length=FrameCount(input), width=Width(input), height=Height(input), pixel_type="RGB32", fps=FrameRateNumerator(input), fps_denominator=FrameRateDenominator(input), color=color), input).ResetMask()
}

# 制作 RB 的时候可以用到。将 RGB32 透明 Clip 制作成 RB。
Function RB(clip input)
{
    return input.Background(color=$FF0000)
}

# 制作 GB 的时候可以用到。将 RGB32 透明 Clip 制作成 GB。
Function GB(clip input)
{
    return input.Background(color=$00FF00)
}

# 制作 BB 的时候可以用到。将 RGB32 透明 Clip 制作成 BB。
Function BB(clip input)
{
    return input.Background(color=$0000FF)
}

# 生成个空视频。
Function BlankVideo(int "length", int "width", int "height", string "pixel_type", float "fps", int "fps_denominator", int "color")
{

    length          = Default(length, 600)
    width           = Default(width, 1920)
    height          = Default(height, 1080)
    pixel_type      = Default(pixel_type, "RGB24")
    fps             = Default(fps, 60)
    fps_denominator = Default(fps_denominator, 1)
    color           = Default(color, $000000)

    return BlankClip(length=length, width=width, height=height, pixel_type=pixel_type, fps=fps, fps_denominator=fps_denominator, color=color).KillAudio()
}

# 生成个空音频，注意是按帧计量。不过 FPS 数值上等于采样率（Hz）时，帧数就是采样长度了？
Function BlankAudio(int "length", float "fps", int "fps_denominator", int "audio_rate", int "channels", string "sample_type")
{

    length          = Default(length, 600)
    fps             = Default(fps, 60)
    fps_denominator = Default(fps_denominator, 1)
    audio_rate      = Default(audio_rate, 48000)
    channels        = Default(channels, 2)
    sample_type     = Default(sample_type, "16bit")

    return BlankClip(length=length, fps=fps, fps_denominator=fps_denominator, audio_rate=audio_rate, channels=channels, sample_type=sample_type).KillVideo()
}

# 对音频添加空视频。
Function AddBlankVideo(clip input, int "width", int "height", string "pixel_type", float "fps", int "fps_denominator", int "color")
{

    width           = Default(width, 1920)
    height          = Default(height, 1080)
    pixel_type      = Default(pixel_type, "RGB24")
    fps             = Default(fps, 60)
    fps_denominator = Default(fps_denominator, 1)
    color           = Default(color, $000000)

    return AudioDub(BlankVideo(length=Round((Float(AudioLength(input))/Float(AudioRate(input)))*(Float(fps)/Float(fps_denominator))), width=width, height=height, pixel_type=pixel_type, fps=fps, fps_denominator=fps_denominator, color=color), input)
}

# 对视频添加空音频。
Function AddBlankAudio(clip input, int "audio_rate", int "channels", string "sample_type")
{

    audio_rate  = Default(audio_rate, 48000)
    channels    = Default(channels, 2)
    sample_type = Default(sample_type, "16bit")

    return AudioDub(input, BlankAudio(length=FrameCount(input), fps=FrameRateNumerator(input), fps_denominator=FrameRateDenominator(input), audio_rate=audio_rate, channels=channels, sample_type=sample_type))
}

# 利用 nnedi3_resize16 将 YUV 升采样到 4:4:4。
Function nnedi3_YV24(clip input, bool "tv_range", string "cplace", bool "lsb_in", bool "lsb")
{
    tv_range = Default(tv_range, True)  # 用 4:2:0 的视频往往是 TV Range。
    cplace   = Default(cplace, "MPEG2") # 色度采样选择使用 MPEG-1 还是 MPEG-2。
    lsb_in   = Default(lsb_in, False)   # 当然也往往是 8-bit。
    lsb      = Default(lsb, True)       # 默认输出 16-bit，以保留高精度 Chroma Resample 结果。

    return input.nnedi3_resize16(output="YV24", tv_range=tv_range, lsb_in=lsb_in, lsb=lsb)
}

# 仅 AviSynth+ 可用。
# 强制将 16-bit 以下 Clip 标为 16-bit，即数值上不扩张到 16-bit。
# 用途主要是让 ConvertToStacked/ConvertToDoubleWidth 顺利进行，因为这俩函数必须要 16-bit 输入，所以为了能让输入、输出都为 10-bit，就写了这个。
Function ForceTo16bit(clip input)
{
    Assert(IsAVSPlus(), "AviSynth+ only!")

    return input.ConvertBits(bits=16, truerange=False)
}

# 判断 AviSynth+ 与否。
Function IsAVSPlus()
{
    sVer = LCase(VersionString)
    return (FindStr(sVer, "avisynth+") > 0) || (FindStr(sVer, "avisynthplus") > 0)
}

# 将 RGB48YV12 转换为 RGB48Y。
# 这个实现方法我自己都没看懂，奇妙深刻，何等申必。
# 有待大触解读。
Function RGB48YV12ToRGB48Y(clip input)
{
    return IsAVSPlus() ? input.RGB48YV12ToRGB48YPlus()
    \                  : input.RGB48YV12ToRGB48Y26()
}

# 将 RGB48YV12ToRGB48Y 逆向，即是说把 RGB48Y 转换为 RGB48YV12。
Function RGB48YToRGB48YV12(clip input)
{
    R = input.SelectEvery(3, 0) # 提取出 R 通道。
    G = input.SelectEvery(3, 1) # 提取出 G 通道。
    B = input.SelectEvery(3, 2) # 提取出 B 通道。

    return Dither_convey_rgb48_on_yv12(R, G, B)
}

# 像 YUV 的 High Bit-Depth 那样 Hack 的 RGB48，我的意思。
# 没什么技术含量。
Function RGB48Stacked(clip input)
{
    return IsAVSPlus() ? input.RGB48StackedPlus()
    \                  : input.RGB48Stacked26()
}

# 将 RGB24 伪装成 YV24。
# 同样没什么技术含量。
Function RGB24YV24(clip input)
{
    return IsAVSPlus() ? input.RGB24YV24Plus()
    \                  : input.RGB24YV2426()
}

# 反过来，将 YV24 伪装成 RGB24。
# 啊啊还是没什么技术含量。
Function YV24RGB24(clip input)
{
    return IsAVSPlus() ? input.YV24RGB24Plus()
    \                  : input.YV24RGB2426()
}

# 当然是把 Hack 的 RGB48 Stack 转回那种 RGB48Y 啊。
Function unRGB48Stacked(clip input)
{
    return IsAVSPlus() ? input.unRGB48StackedPlus()
    \                  : input.unRGB48Stacked26()
}

# 在 AviSynth+ 中还没有什么很方便把 RGB48Y 读到 RGB48 的方法。毕竟 ConvertFromStacked 只支持 YUV。
# 那么就使用这种伪装成 YUV 的方法吧。
Function RGB48(clip input)
{
    Assert(IsAVSPlus(), "AviSynth+ only!")

    R = input.SelectEvery(3, 0) # 提取出 R 通道。
    G = input.SelectEvery(3, 1) # 提取出 G 通道。
    B = input.SelectEvery(3, 2) # 提取出 B 通道。

    CombinePlanes(R, G, B, "YUV") # 伪装成 YUV。
    ConvertFromStacked()          # 这样就没问题了吧。

    R = ExtractY() # 因为是 High Bit-Depth 所以要用 Extract，这也是 AviSynth+ 所独有的。
    G = ExtractU()
    B = ExtractV()

    return CombinePlanes(R, G, B, "RGB").Planar2Interleaved()
}

# 把 AviSynth+ RGB48 转到 RGB48Y 去。
Function unRGB48(clip input)
{
    Assert(IsAVSPlus(), "AviSynth+ only!")

    R = input.ExtractR() # 提取出 R 通道。
    G = input.ExtractG() # 提取出 G 通道。
    B = input.ExtractB() # 提取出 B 通道。

    CombinePlanes(R, G, B, "YUV") # 同样伪装成 YUV。
    ConvertToStacked()            # 啊，又是。

    R = ExtractY()
    G = ExtractU()
    B = ExtractV()

    return Interleave(R, G, B) # 但是这里稍稍不同了，因为 RGB48Y 是把通道拆散到三帧的。
}

# 利用 nnedi3_resize16 将 YUV 采样到 4:2:0。
# 有时间的话，为了获得比屑站二压更高的 Chroma Resample 精度，就可以用这个。
Function nnedi3_YV12(clip input, bool "tv_range", string "cplace", bool "lsb_in", bool "lsb")
{
    tv_range = Default(tv_range, True)  # 用 4:2:0 的视频往往是 TV Range。
    cplace   = Default(cplace, "MPEG2") # 色度采样选择使用 MPEG-1 还是 MPEG-2。
    lsb_in   = Default(lsb_in, False)   # 当然也往往是 8-bit。
    lsb      = Default(lsb, True)       # 默认输出 16-bit，以保留高精度 Chroma Resample 结果。

    return input.nnedi3_resize16(output="YV12", tv_range=tv_range, lsb_in=lsb_in, lsb=lsb)
}

# 转换 Interleaved 至 Planar。
# 若未转换原样输出，不报错。因为这不像在 AviSynth 2.6 跑 AviSynth+ 专用函数会 RP（当然就算不 Assert 也会提示找不到函数？），就没设了。使用时要多加注意。
Function Interleaved2Planar(clip input)
{
    return PixelType(input) == "RGB24" || PixelType(input) == "RGB48" ? input.ConvertToPlanarRGB()
    \    : PixelType(input) == "RGB32" || PixelType(input) == "RGB64" ? input.ConvertToPlanarRGBA()
    \    : PixelType(input) == "YUY2"                                 ? input.ConvertToYV16()
    \    :                                                              input
}

# 转换 Planar 至 Interleaved。
Function Planar2Interleaved(clip input)
{
    return PixelType(input) == "RGBP"    ? input.ConvertToRGB24()
    \    : PixelType(input) == "RGBP16"  ? input.ConvertToRGB48()
    \    : PixelType(input) == "RGBAP"   ? input.ConvertToRGB32()
    \    : PixelType(input) == "RGBAP16" ? input.ConvertToRGB64()
    \    : PixelType(input) == "YV16"    ? input.ConvertToYUY2()
    \    :                                 input
}

# RGB48YV12ToRGB48Y AviSynth 2.6 版。
Function RGB48YV12ToRGB48Y26(clip input)
{
    width  = Width(input)
    height = Height(input)

    Y = input.ConvertToY8() # 提取出 Y 通道，并存储为 Y8。
    U = input.UToY8()       # 提取出 U 通道，并存储为 Y8。
    V = input.VToY8()       # 提取出 V 通道，并存储为 Y8。

    StackVertical(U, V).SeparateFields()
    StackVertical(Y, StackHorizontal(SelectEven(), SelectOdd()))

    m  = PointResize(width, height * 2).SeparateFields()
    m0 = m.SelectOdd().AssumeFrameBased().SeparateFields()
    m1 = m.SelectEven().AssumeFrameBased().SeparateFields()

    o = m0.SelectOdd()
    p = m1.SelectEven()
    q = m0.SelectEven()
    StackHorizontal(o, p, q)

    SeparateColumns(2)
    StackVertical(SelectOdd(), SelectEven())
    m  = PointResize(width * 2, height).AssumeFrameBased().SeparateColumns(2)
    m0 = m.SelectOdd().AssumeFrameBased().SeparateColumns(2)
    m1 = m.SelectEven().AssumeFrameBased().SeparateColumns(2)

    R = m0.SelectEven()
    G = m1.SelectOdd()
    B = m0.SelectOdd()

    return Interleave(R, G, B)
}

# RGB48YV12ToRGB48Y AviSynth+ 版。
Function RGB48YV12ToRGB48YPlus(clip input)
{
    Assert(IsAVSPlus(), "AviSynth+ only!")

    width  = Width(input)
    height = Height(input)

    Y = input.ExtractY() # 使用 AviSynth+ 特有的 Extract 代替 *ToY8。
    U = input.ExtractU()
    V = input.ExtractV()

    StackVertical(U, V).SeparateFields()
    StackVertical(Y, StackHorizontal(SelectEven(), SelectOdd()))

    m  = PointResize(width, height * 2).SeparateFields()
    m0 = m.SelectOdd().AssumeFrameBased().SeparateFields()
    m1 = m.SelectEven().AssumeFrameBased().SeparateFields()

    o = m0.SelectOdd()
    p = m1.SelectEven()
    q = m0.SelectEven()
    StackHorizontal(o, p, q)

    SeparateColumns(2)
    StackVertical(SelectOdd(), SelectEven())
    m  = PointResize(width * 2, height).AssumeFrameBased().SeparateColumns(2)
    m0 = m.SelectOdd().AssumeFrameBased().SeparateColumns(2)
    m1 = m.SelectEven().AssumeFrameBased().SeparateColumns(2)

    R = m0.SelectEven()
    G = m1.SelectOdd()
    B = m0.SelectOdd()

    return Interleave(R, G, B)
}

# RGB48Stacked AviSynth 2.6 版。
Function RGB48Stacked26(clip input)
{
    R = input.SelectEvery(3, 0) # 提取出 R 通道。
    G = input.SelectEvery(3, 1) # 提取出 G 通道。
    B = input.SelectEvery(3, 2) # 提取出 B 通道。

    return MergeRGB(R, G, B, pixel_type="RGB24")
}

# RGB48Stacked AviSynth+ 版。
Function RGB48StackedPlus(clip input)
{
    Assert(IsAVSPlus(), "AviSynth+ only!")

    R = input.SelectEvery(3, 0)
    G = input.SelectEvery(3, 1)
    B = input.SelectEvery(3, 2)

    return CombinePlanes(R, G, B, "RGB").Planar2Interleaved()
}

# RGB24YV24 AviSynth 2.6 版。
Function RGB24YV2426(clip input)
{
    R = input.ShowRed(pixel_type="Y8")   # 提取出 R 通道。
    G = input.ShowGreen(pixel_type="Y8") # 提取出 G 通道。
    B = input.ShowBlue(pixel_type="Y8")  # 提取出 B 通道。

    return YToUV(G, B, R)
}

# RGB24YV24 AviSynth+ 版。
Function RGB24YV24Plus(clip input)
{
    Assert(IsAVSPlus(), "AviSynth+ only!")

    R = input.ExtractR()
    G = input.ExtractG()
    B = input.ExtractB()

    return CombinePlanes(R, G, B, "YUV")
}

# YV24RGB24 AviSynth 2.6 版。
Function YV24RGB2426(clip input)
{
    Y = input.ConvertToY8() # 提取出 Y 通道。
    U = input.UToY8()       # 提取出 U 通道。
    V = input.VToY8()       # 提取出 V 通道。

    return MergeRGB(Y, U, V, pixel_type="RGB24")
}

# YV24RGB24 AviSynth+ 版。
Function YV24RGB24Plus(clip input)
{
    Assert(IsAVSPlus(), "AviSynth+ only!")

    Y = input.ExtractY()
    U = input.ExtractU()
    V = input.ExtractV()

    return CombinePlanes(Y, U, V, "RGB").Planar2Interleaved()
}

# unRGB48Stacked AviSynth 2.6 版。
Function unRGB48Stacked26(clip input)
{
    R = input.ShowRed(pixel_type="Y8")   # 提取出 R 通道。
    G = input.ShowGreen(pixel_type="Y8") # 提取出 G 通道。
    B = input.ShowBlue(pixel_type="Y8")  # 提取出 B 通道。

    return Interleave(R, G, B)
}

# unRGB48Stacked AviSynth+ 版。
Function unRGB48StackedPlus(clip input)
{
    Assert(IsAVSPlus(), "AviSynth+ only!")

    R = input.ExtractR()
    G = input.ExtractG()
    B = input.ExtractB()

    return Interleave(R, G, B)
}
