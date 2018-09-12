# Ishisashi 制作的 AviSynth 快捷脚本
# 依赖：[O16 (mawen1250 mod)](https://www.nmm-hd.org/newbbs/viewtopic.php?t=1017)、[Dither tools](https://forum.doom9.org/showpost.php?p=1386559)

Function RGB2YUV(clip input, string "matrix", bool "tv_range", bool "lsb", string "output", int "dither")
{
    matrix   = Default(matrix, "YCgCo") # 个人喜欢使用 YCgCo，所以就这样设定了。
    tv_range = Default(tv_range, False) # PC Range 也是同理。
    lsb      = Default(lsb, True)       # 设置为 True 就是 16-bit，False 就是 8-bit。
    output   = Default(output, "YV24")
    dither   = Default(dither, -3)      # 抖动算法，默认是用的 Floyd-Steinberg dithering。参见 O16 的 Down10。

    return lsb == False ? input.Dither_convert_rgb_to_yuv(matrix=matrix, tv_range=tv_range, lsb=True, mode=-1, ampn=0, output=output).Down10(depth=8, TVrange=tv_range, dither=dither) : input.Dither_convert_rgb_to_yuv(matrix=matrix, tv_range=tv_range, lsb=lsb, mode=-1, ampn=0, output=output)
}

Function YUV2RGB(clip input, string "matrix", bool "tv_range", bool "lsb", string "output")
{
    matrix   = Default(matrix, "YCgCo")
    tv_range = Default(tv_range, False)
    lsb      = Default(lsb, True)
    output   = Default(output, "rgb24")

    return output == "rgb32" ? input.Dither_convert_yuv_to_rgb(matrix=matrix, tv_range=tv_range, lsb_in=lsb, mode=-1, ampn=0, output="rgb32").ResetMask() : input.Dither_convert_yuv_to_rgb(matrix=matrix, tv_range=tv_range, lsb_in=lsb, mode=-1, ampn=0, output=output)
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
    return input.f3kdb(range=0, Y=0, Cb=0, Cr=0, grainY=0, grainC=0, input_mode=2, output_mode=1)
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

    return input.f3kdb(range=0, Y=0, Cb=0, Cr=0, grainY=0, grainC=0, input_mode=2, input_depth=10, output_mode=1, output_depth=16).YUV2RGB(matrix=matrix, tv_range=tv_range, output=output)
}

# 将 RGB32 透明 Clip 制作成 Alpha Stack。
Function AlphaStack(clip input)
{
    return StackVertical(input, ShowAlpha(input)).ResetMask()
}

# 将 Alpha Stack 解译为 RGB32。
Function unAlphaStack(clip input)
{	
    return Mask(Crop(PixelType(input) == "RGB24" ? input.ConvertToRGB32() : input, 0, 0, -0, -Height(input)/2), Crop(input, 0, Height(input)/2, -0, -0))
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

# 对视频添加空音频。
Function AddBlankAudio(clip input, int "audio_rate", int "channels", string "sample_type")
{

    audio_rate  = Default(audio_rate, 48000)
    channels    = Default(channels, 2)
    sample_type = Default(sample_type, "16bit")

    return AudioDub(input, BlankAudio(length=FrameCount(input), fps=FrameRateNumerator(input), fps_denominator=FrameRateDenominator(input), audio_rate=audio_rate, channels=channels, sample_type=sample_type))
}
