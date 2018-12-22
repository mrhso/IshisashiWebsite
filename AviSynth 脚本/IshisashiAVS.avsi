# Ishisashi 制作的 AviSynth 快捷脚本
# 直接依赖：[O16 (Ishisashi mod)](https://www.nmm-hd.org/newbbs/viewtopic.php?t=1017)、[Dither tools (Ishisashi mod)](https://forum.doom9.org/showpost.php?p=1386559)、[nnedi3_resize16 (Ishisashi mod)](https://www.nmm-hd.org/newbbs/viewtopic.php?t=1117)、[flash3kyuu_deband](https://www.nmm-hd.org/newbbs/viewtopic.php?t=239)、[SmoothAdjust](https://forum.doom9.org/showthread.php?t=154971)
# 直接依赖的依赖自己去找，QQQXX。
# 实际使用中已能通过 IsAVSPlus 自动判断来为 AVS+ 优化。
# 对 AviSynth 不可用而 AviSynth+ 可用的情况（如原生 High Bit-Depth），为简便，未标有「Plus」。

Function RGB2YUV(clip input, string "matrix", bool "tv_range", bool "lsb", string "output", int "dither", float "kr", float "kg", float "kb")
{
    matrix   = Default(matrix, "YCgCo")                             # 个人喜欢使用 YCgCo，所以就这样设定了。
    tv_range = Default(tv_range, False)                             # PC Range 也是同理。
    lsb      = Default(lsb, True)                                   # 设置为 True 就是 16-bit，False 就是 8-bit。
    dither   = tv_range ? Default(dither, -3) : Default(dither, 50) # 降至 8-bit 的抖动算法，默认情况对 TV Range 是用的 Floyd-Steinberg dithering，PC Range 的 Dither 带有 Random Noise。参见 O16 的 Down10。
    output   = Default(output, "YV24")                              # 当然不建议用这个设定 YV12，更建议用 nnedi3 降一下。

    input_16 = tv_range ? input.unRGB48Stacked().AddNullMSB().iSmoothCurve16(Ycurve="0-0;255-65280;65535-65280", mode=0, interp=0, HQ=False, dither=-1, limiter=False, TVrange=0)
    \                   : input.unRGB48Stacked().AddNullMSB().iSmoothCurve16(Ycurve="0-0;255-65535;65535-65535", mode=0, interp=0, HQ=False, dither=-1, limiter=False, TVrange=0)

    r = input_16.SelectEvery(3, 0)
    g = input_16.SelectEvery(3, 1)
    b = input_16.SelectEvery(3, 2)

    out_clip = Dither_convert_rgb_to_yuv(r, g=g, b=b, matrix=matrix, tv_range=tv_range, lsb=True, mode=-1, ampn=0, output=output, kr=kr, kg=kg, kb=kb)

    return lsb ? out_clip
    \          : out_clip.Down10(depth=8, TVrange=tv_range, dither=dither)
}

Function YUV2RGB(clip input, string "matrix", bool "tv_range", bool "lsb", string "output", float "kr", float "kg", float "kb")
{
    matrix   = Default(matrix, "YCgCo")
    tv_range = Default(tv_range, False)
    lsb      = Default(lsb, True)
    output   = Default(output, "rgb24")

    input_16 = lsb ? input
    \              : input.U16(TVrange=tv_range)

    dither_output = input_16.Dither_convert_yuv_to_rgb(matrix=matrix, tv_range=tv_range, lsb_in=True, mode=-1, ampn=0, output="rgb48y", kr=kr, kg=kg, kb=kb)

    curved = output == "rgb24" || output == "rgb32" ? tv_range ? dither_output.iSmoothCurve16(Ycurve="0-0;65280-255;65535-255", mode=0, interp=0, HQ=False, dither=-1, limiter=False, TVrange=0)
    \                                                          : dither_output.iSmoothCurve16(Ycurve="0-0;65535-255", mode=0, interp=0, HQ=False, dither=-1, limiter=False, TVrange=0)
    \                                               : tv_range ? dither_output.iSmoothCurve16(Ycurve="0-0;65280-65535;65535-65535", mode=0, interp=0, HQ=False, dither=-1, limiter=False, TVrange=0)
    \                                                          : dither_output

    out_clip = output == "rgb24" || output == "rgb32" ? curved.Dither_get_lsb().RGB48Stacked()
    \                                                 : output == "rgb48yv12" ? curved.RGB48YToRGB48YV12()
    \                                                                         : curved

    return output == "rgb32" ? out_clip.ConvertToRGB32()
    \                        : out_clip
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

# 将 C16 逆向，即是说把交织（Interleaved）转为层叠（Stacked）。
Function unC16(clip input)
{
    return IsAVSPlus() ? input.ConvertFromDoubleWidth().ConvertToStacked()
    \                  : input.f3kdb(Y=0, Cb=0, Cr=0, grainY=0, grainC=0, keep_tv_range=False, input_mode=2, output_mode=1)
}

# 这个是从 RGB 输出喂给 x264 的 10-bit Interleaved YUV 的函数。
Function x264(clip input, string "matrix", bool "tv_range", string "output", int "dither", float "kr", float "kg", float "kb")
{
    matrix   = Default(matrix, "YCgCo")
    tv_range = Default(tv_range, False)
    dither   = Default(dither, -1)
    output   = Default(output, "YV24")

    input.RGB2YUV(matrix=matrix, tv_range=tv_range, lsb=True, output=output, kr=kr, kg=kg, kb=kb)

    out_clip = Down10(depth=10, TVrange=tv_range, dither=dither)

    return out_clip.C16()
}

# 解码 10-bit Interleaved YUV 到 RGB。
Function unx264(clip input, string "matrix", bool "tv_range", string "output", int "dither", float "kr", float "kg", float "kb")
{
    matrix   = Default(matrix, "YCgCo")
    tv_range = Default(tv_range, False)
    dither   = Default(dither, -1)      # 这个 Dither 到底有什么用，我暂且蒙在鼓里。
    output   = Default(output, "rgb24")

    input.unC16()

    out_clip = tv_range ? iSmoothCurve16(Ycurve="0-4096;64-4096;940-60160;65535-60160", Ucurve="0-4096;64-4096;512-32768;960-61440;65535-61440", Vcurve="0-4096;64-4096;512-32768;960-61440;65535-61440", mode=0, interp=0, HQ=False, dither=dither, limiter=False, TVrange=0)
    \                   : iSmoothCurve16(Ycurve="0-0;1023-65535;65535-65535", Ucurve="0-0.5;0.5-0.5;512-32768;1023-65503.4692082111;65535-65503.4692082111", Vcurve="0-0.5;0.5-0.5;512-32768;1023-65503.4692082111;65535-65503.4692082111", mode=0, interp=0, HQ=False, dither=dither, limiter=False, TVrange=0)
    # BitDepth(input_depth=10, output_depth=16, input_TVrange=tv_range, output_TVrange=tv_range, dither=dither)
    # O16 mod BitDepth() 的位深转换疑似有问题，解决前还是手写 SmoothCurve 比较好。

    return out_clip.YUV2RGB(matrix=matrix, tv_range=tv_range, output=output, kr=kr, kg=kg, kb=kb)
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

    return AudioDubEx(BlankVideo(length=Round((Float(AudioLength(input))/Float(AudioRate(input)))*(Float(fps)/Float(fps_denominator))), width=width, height=height, pixel_type=pixel_type, fps=fps, fps_denominator=fps_denominator, color=color), input)
}

# 对视频添加空音频。
Function AddBlankAudio(clip input, int "audio_rate", int "channels", string "sample_type")
{

    audio_rate  = Default(audio_rate, 48000)
    channels    = Default(channels, 2)
    sample_type = Default(sample_type, "16bit")

    return AudioDubEx(input, BlankAudio(length=FrameCount(input), fps=FrameRateNumerator(input), fps_denominator=FrameRateDenominator(input), audio_rate=audio_rate, channels=channels, sample_type=sample_type))
}

# 利用 nnedi3_resize16 将 YUV 升采样到 4:4:4。
Function nnedi3_YV24(clip input, bool "tv_range", string "cplace", bool "lsb_in", bool "lsb")
{
    tv_range = Default(tv_range, True)  # 用 4:2:0 的视频往往是 TV Range。
    cplace   = Default(cplace, "MPEG2") # 色度采样选择使用 MPEG-1 还是 MPEG-2。
    lsb_in   = Default(lsb_in, False)   # 当然也往往是 8-bit。
    lsb      = Default(lsb, True)       # 默认输出 16-bit，以保留高精度 Chroma Resample 结果。

    return input.nnedi3_resize16(output="YV24", tv_range=tv_range, cplace=cplace, lsb_in=lsb_in, lsb=lsb)
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
    width  = Width(input)
    height = Height(input)

    Y = IsAVSPlus() ? input.ExtractY()    # 提取出 Y 通道，并存储为 Y8。
    \               : input.ConvertToY8()
    U = IsAVSPlus() ? input.ExtractU()    # 提取出 U 通道，并存储为 Y8。
    \               : input.UToY8()
    V = IsAVSPlus() ? input.ExtractV()    # 提取出 V 通道，并存储为 Y8。
    \               : input.VToY8()

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
    R = input.SelectEvery(3, 0) # 提取出 R 通道。
    G = input.SelectEvery(3, 1) # 提取出 G 通道。
    B = input.SelectEvery(3, 2) # 提取出 B 通道。

    return IsAVSPlus() ? CombinePlanes(R, G, B, "RGB").Planar2Interleaved()
    \                  : MergeRGB(R, G, B, pixel_type="RGB24")
}

# 将 RGB24 伪装成 YV24。
# 同样没什么技术含量。
Function RGB24YV24(clip input)
{
    R = IsAVSPlus() ? input.ExtractR()                 # 提取出 R 通道。
    \               : input.ShowRed(pixel_type="Y8")
    G = IsAVSPlus() ? input.ExtractG()                 # 提取出 G 通道。
    \               : input.ShowGreen(pixel_type="Y8")
    B = IsAVSPlus() ? input.ExtractB()                 # 提取出 B 通道。
    \               : input.ShowBlue(pixel_type="Y8")

    return IsAVSPlus() ? CombinePlanes(R, G, B, "YUV")
    \                  : YToUV(G, B, R)
}

# 反过来，将 YV24 伪装成 RGB24。
# 啊啊还是没什么技术含量。
Function YV24RGB24(clip input)
{
    Y = IsAVSPlus() ? input.ExtractY()    # 提取出 Y 通道。
    \               : input.ConvertToY8()
    U = IsAVSPlus() ? input.ExtractU()    # 提取出 U 通道。
    \               : input.UToY8()
    V = IsAVSPlus() ? input.ExtractV()    # 提取出 V 通道。
    \               : input.VToY8()

    return IsAVSPlus() ? CombinePlanes(Y, U, V, "RGB").Planar2Interleaved()
    \                  : MergeRGB(Y, U, V, pixel_type="RGB24")
}

# 当然是把 Hack 的 RGB48 Stack 转回那种 RGB48Y 啊。
Function unRGB48Stacked(clip input)
{
    R = IsAVSPlus() ? input.ExtractR()                 # 提取出 R 通道。
    \               : input.ShowRed(pixel_type="Y8")
    G = IsAVSPlus() ? input.ExtractG()                 # 提取出 G 通道。
    \               : input.ShowGreen(pixel_type="Y8")
    B = IsAVSPlus() ? input.ExtractB()                 # 提取出 B 通道。
    \               : input.ShowBlue(pixel_type="Y8")

    return Interleave(R, G, B)
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

    return input.nnedi3_resize16(output="YV12", cplace=cplace, tv_range=tv_range, lsb_in=lsb_in, lsb=lsb)
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

# 中间凑成 Mod 2，然后剪回，都可以用这个。
Function ForceMod(clip input, bool "lsb" ,bool "crop", int "horizontal", int "vertical")
{
    return horizontal == 0 && vertical == 0 ? input
    \                                       : lsb ? crop ? input.Dither_Crop16(0, 0, -horizontal, -vertical)
    \                                                    : input.Dither_Addborders16(0, 0, horizontal, vertical)
    \                                             : crop ? input.Crop(0, 0, -horizontal, -vertical)
    \                                                    : input.AddBorders(0, 0, horizontal, vertical)
}

# 给 8-bit 加上空的 MSB。
Function AddNullMSB(clip input)
{
    return StackVertical(input.Dither_gen_null_lsb(), input)
}

# 突破 Mod 2 限制的 SmoothCurve。
Function iSmoothCurve(clip input, string "Ycurve", string "Ucurve", string "Vcurve", int "mode", bool "limiter", int "TVrange", int "interp", int "dither", bool "HQ", int "useMT", int "useOPT", bool "debug", int "screenW", int "screenH", bool "scale")
{
    wm2 = input.Width()%2
    hm2 = input.Height()%2

    return input.ForceMod(lsb=False, crop=False, horizontal=wm2, vertical=hm2).SmoothCurve(Ycurve=Ycurve, Ucurve=Ucurve, Vcurve=Vcurve, mode=mode, limiter=limiter, TVrange=TVrange, interp=interp, dither=dither, HQ=HQ, useMT=useMT, useOPT=useOPT, debug=debug, screenW=screenW, screenH=screenH, scale=scale).ForceMod(lsb=False, crop=True, horizontal=wm2, vertical=hm2)
}

# 突破 Mod 2 限制的 SmoothCurve16。
Function iSmoothCurve16(clip input, string "Ycurve", string "Ucurve", string "Vcurve", int "mode", bool "limiter", int "TVrange", int "interp", int "dither", bool "HQ", int "useMT", int "useOPT", bool "debug", int "screenW", int "screenH", bool "scale")
{
    wm2 = input.Width()%2
    hm2 = input.Height()/2%2

    return input.ForceMod(lsb=True, crop=False, horizontal=wm2, vertical=hm2).SmoothCurve16(Ycurve=Ycurve, Ucurve=Ucurve, Vcurve=Vcurve, mode=mode, limiter=limiter, TVrange=TVrange, interp=interp, dither=dither, HQ=HQ, useMT=useMT, useOPT=useOPT, debug=debug, screenW=screenW, screenH=screenH, scale=scale).ForceMod(lsb=True, crop=True, horizontal=wm2, vertical=hm2)
}
