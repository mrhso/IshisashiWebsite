# Ishisashi 制作的 AviSynth 快捷脚本
# 依赖：[O16 (mawen1250 mod)](https://www.nmm-hd.org/newbbs/viewtopic.php?t=1017)、[Dither tools](https://forum.doom9.org/showpost.php?p=1386559)、[nnedi3_resize16](https://www.nmm-hd.org/newbbs/viewtopic.php?t=1117)、[flash3kyuu_deband](https://www.nmm-hd.org/newbbs/viewtopic.php?t=239)
# 在同时有 AviSynth 和 AviSynth+ 不同实现方案的情况下，「Plus」为 AviSynth+ 专用版函数，效率可能比通用版更高。
# 对 AviSynth 不可用而 AviSynth+ 可用的情况（如原生 High Bit-Depth），为简便，未标有「Plus」。判断详见注释。

Function RGB2YUV(clip input, string "matrix", bool "tv_range", bool "lsb", string "output", int "dither")
{
    matrix   = Default(matrix, "YCgCo") # 个人喜欢使用 YCgCo，所以就这样设定了。
    tv_range = Default(tv_range, False) # PC Range 也是同理。
    lsb      = Default(lsb, True)       # 设置为 True 就是 16-bit，False 就是 8-bit。
    output   = Default(output, "YV24")
    dither   = Default(dither, -3)      # 抖动算法，默认是用的 Floyd-Steinberg dithering。参见 O16 的 Down10。

    YUV = input.Dither_convert_rgb_to_yuv(matrix=matrix, tv_range=tv_range, lsb=True, mode=-1, ampn=0, output=output)

    return lsb ? YUV : YUV.Down10(depth=8, TVrange=tv_range, dither=dither)
}

Function YUV2RGB(clip input, string "matrix", bool "tv_range", bool "lsb", string "output")
{
    matrix   = Default(matrix, "YCgCo")
    tv_range = Default(tv_range, False)
    lsb      = Default(lsb, True)
    output   = Default(output, "rgb24")

    RGB = input.Dither_convert_yuv_to_rgb(matrix=matrix, tv_range=tv_range, lsb_in=lsb, mode=-1, ampn=0, output=output)

    return output == "rgb32" ? RGB.ResetMask() : RGB
}

Function YUV2RGB24(clip input, string "matrix", bool "tv_range", bool "lsb")
{
    matrix   = Default(matrix, "YCgCo")
    tv_range = Default(tv_range, False)
    lsb      = Default(lsb, True)

    return input.YUV2RGB(matrix=matrix, tv_range=tv_range, lsb=lsb, output="rgb24")
}

Function YUV2RGB32(clip input, string "matrix", bool "tv_range", bool "lsb")
{
    matrix   = Default(matrix, "YCgCo")
    tv_range = Default(tv_range, False)
    lsb      = Default(lsb, True)

    return input.YUV2RGB(matrix=matrix, tv_range=tv_range, lsb=lsb, output="rgb32")
}

# 将 C16 逆向，即是说把交织（Interleaved）转为层叠（Stacked）。
Function unC16(clip input)
{
    return input.f3kdb(Y=0, Cb=0, Cr=0, grainY=0, grainC=0, keep_tv_range=false, input_mode=2, output_mode=1)
}

# 这个是从 RGB 输出喂给 x264 的 10-bit Interleaved YUV 的函数。
Function x264(clip input, string "matrix", bool "tv_range", int "dither")
{
    matrix   = Default(matrix, "YCgCo")
    tv_range = Default(tv_range, False)
    dither   = Default(dither, -1)

    return input.RGB2YUV(matrix=matrix, tv_range=tv_range).Down10(depth=10, TVrange=tv_range, dither=dither).C16()
}

# 解码 10-bit Interleaved YUV 到 RGB。
Function unx264(clip input, string "matrix", bool "tv_range", string "output")
{
    matrix   = Default(matrix, "YCgCo")
    tv_range = Default(tv_range, False)
    output   = Default(output, "rgb24")

    return input.un10bit(matrix=matrix, tv_range=tv_range, input_mode=2, output=output)
}

# 将 RGB32 透明 Clip 制作成 Alpha Stack。
Function AlphaStack(clip input)
{
    return StackVertical(input, ShowAlpha(input)).ResetMask()
}

# 将 Alpha Stack 解译为 RGB32。
Function unAlphaStack(clip input)
{
    RGB32 = PixelType(input) == "RGB24" ? input.ConvertToRGB32() : input

    return Mask(Crop(RGB32, 0, 0, -0, -Height(RGB32)/2), Crop(RGB32, 0, Height(RGB32)/2, -0, -0))
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

# 利用 nnedi3_resize16 将 4:2:0/4:2:2 YUV 转换到 4:4:4。
Function nnedi3_YV24(clip input, bool "lsb_in", bool "tv_range", bool "lsb")
{
    lsb_in   = Default(lsb_in, False)  # 一般用了 4:2:0 的视频，也往往是 8-bit 的。
    tv_range = Default(tv_range, True) # 同理也往往是 TV Range。
    lsb      = Default(lsb, True)      # 默认输出 16-bit，以保留高精度 Chroma-Resize 结果。

    return input.nnedi3_resize16(output="YV24", tv_range=tv_range, lsb_in=lsb_in, lsb=lsb)
}

# 解码 10-bit YUV 到 RGB。
Function un10bit(clip input, string "matrix", bool "tv_range", int "input_mode", string "output")
{
    matrix     = Default(matrix, "YCgCo")
    tv_range   = Default(tv_range, False)
    input_mode = Default(input_mode, 2)   # 1 为层叠（Stacked），2 为交织（Interleaved）。
    output     = Default(output, "rgb24")

    return input.f3kdb(Y=0, Cb=0, Cr=0, grainY=0, grainC=0, keep_tv_range=false, input_mode=input_mode, input_depth=10, output_mode=1, output_depth=16).YUV2RGB(matrix=matrix, tv_range=tv_range, output=output)
}

# C16 AviSynth+ 版。
Function C16Plus(clip input)
{
    return input.ConvertFromStacked().ConvertToDoubleWidth()
}

# unC16 AviSynth+ 版。
Function unC16Plus(clip input)
{
    return input.ConvertFromDoubleWidth().ConvertToStacked()
}

# 仅 AviSynth+。
# 强制将 16-bit 以下 Clip 标为 16-bit，即数值上不扩张到 16-bit。
# 但是，这个实现方法好像有点强行 www
# 用途主要是让 ConvertToStacked/ConvertToDoubleWidth 顺利进行，因为这俩函数必须要 16-bit 输入，所以为了能让输入、输出都为 10-bit，就写了这个。
Function ForceTo16bit(clip input)
{
    return input.Expr("x", format=LeftStr(PixelType, StrLen(PixelType)-StrLen(String(BitsPerComponent))) + "16")
}
