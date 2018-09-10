# Ishisashi 制作的 AviSynth 快捷脚本
# 依赖：[O16 (mawen1250 mod)](https://www.nmm-hd.org/newbbs/viewtopic.php?t=1017)、[Dither tools](https://forum.doom9.org/showpost.php?p=1386559)

Function RGB2YUV(clip input, string "matrix", bool "tvrange", bool "lsb", string "output", int "dither")
{
    matrix  = Default(matrix, "YCgCo") # 个人喜欢使用 YCgCo，所以就这样设定了。
    tvrange = Default(tvrange, False)  # PC Range 也是同理。
    lsb     = Default(lsb, True)       # 设置为 True 就是 16-bit，False 就是 8-bit。
    output  = Default(output, "YV24")
    dither  = Default(dither, -3)      # 抖动算法，默认是用的 Floyd-Steinberg dithering。参见 O16 的 Down10。

    return lsb == False ? input.Dither_convert_rgb_to_yuv(matrix=matrix, tv_range=tvrange, lsb=True, mode=-1, ampn=0, output=output).Down10(depth=8, TVrange=tvrange, dither=dither) : input.Dither_convert_rgb_to_yuv(matrix=matrix, tv_range=tvrange, lsb=lsb, mode=-1, ampn=0, output=output)
}

Function YUV2RGB(clip input, string "matrix", bool "tvrange", bool "lsb", string "output")
{
    matrix  = Default(matrix, "YCgCo")
    tvrange = Default(tvrange, False)
    lsb     = Default(lsb, True)
    output  = Default(output, "rgb24")

    return output == "rgb32" ? input.Dither_convert_yuv_to_rgb(matrix=matrix, tv_range=tvrange, lsb_in=lsb, mode=-1, ampn=0, output="rgb32").ResetMask() : input.Dither_convert_yuv_to_rgb(matrix=matrix, tv_range=tvrange, lsb_in=lsb, mode=-1, ampn=0, output=output)
}

Function YUV2RGB24(clip input, string "matrix", bool "tvrange", bool "lsb")
{
    matrix  = Default(matrix, "YCgCo")
    tvrange = Default(tvrange, False)
    lsb     = Default(lsb, True)

    return input.YUV2RGB(matrix=matrix, tvrange=tvrange, lsb=lsb, output="rgb24")
}

Function YUV2RGB32(clip input, string "matrix", bool "tvrange", bool "lsb")
{
    matrix  = Default(matrix, "YCgCo")
    tvrange = Default(tvrange, False)
    lsb     = Default(lsb, True)

    return input.YUV2RGB(matrix=matrix, tvrange=tvrange, lsb=lsb, output="rgb32")
}

Function unC16(clip input) # 将 C16 逆向，即是说把交织（Interleaved）转为层叠（Stacked）。
{
    return input.f3kdb(range=0, Y=0, Cb=0, Cr=0, grainY=0, grainC=0, input_mode=2, output_mode=1)
}

Function x264(clip input, string "matrix", bool "tvrange", int "dither") # 这个是从 RGB 输出喂给 x264 的 10-bit Interleaved YUV 的函数。
{
    matrix  = Default(matrix, "YCgCo")
    tvrange = Default(tvrange, False)
    dither  = Default(dither, -1)

    return input.RGB2YUV(matrix=matrix, tvrange=tvrange).Down10(depth=10, TVrange=tvrange, dither=dither).C16()
}

Function unx264(clip input, string "matrix", bool "tvrange")
{
    matrix  = Default(matrix, "YCgCo")
    tvrange = Default(tvrange, False)

    return input.f3kdb(range=0, Y=0, Cb=0, Cr=0, grainY=0, grainC=0, input_mode=2, input_depth=10, output_mode=1, output_depth=16).YUV2RGB(matrix=matrix, tvrange=tvrange)
}

Function AlphaStack(clip input) # 将 RGB32 透明 Clip 制作成 Alpha Stack。
{
    return StackVertical(input, ShowAlpha(input)).ResetMask()
}

Function unAlphaStack(clip input)
{
    return Mask(Crop(input, 0, 0, -0, -Height(input)/2), Crop(input, 0, Height(input)/2, -0, -0))
}

Function Background(clip input, int "color")
{
    color = Default(color, $000000)

    return Layer(BlankClip(length=FrameCount(input), width=Width(input), height=Height(input), fps=FrameRateNumerator(input), fps_denominator=FrameRateDenominator(input), color=color).KillAudio(), input).ResetMask()
}

Function RB(clip input)
{
    return input.Background(color=$FF0000)
}

Function GB(clip input)
{
    return input.Background(color=$00FF00)
}

Function BB(clip input) # 制作 BB 的时候可以用到。将 RGB32 透明 Clip 制作成 BB。
{
    return input.Background(color=$0000FF)
}
