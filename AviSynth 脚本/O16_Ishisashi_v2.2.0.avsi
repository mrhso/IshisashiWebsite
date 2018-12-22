#############################################################################################
###                                                                                       ###
### O16 & Down10 v2.2.0: output 16 bit clip using "dither", "f3kdb" or "SmoothAdjust"     ###
### original script by 06_taro, 1st modified by mawen1250, 2nd modified by Ishisashi      ###
###                                                                                       ###
#############################################################################################
###
### Changelog:
### 2014.03.22 mod v2.2.0 - Fix overflow issue with CbCr down-conversion in PC Range
###                       - Replace U10 function call in O16 with BitDepth
###                       - Parameter "pixel_type" actually works in O16mod_TestPattern
###                       - Add O16mod_TestPattern16, O16mod_TestPattern renamed to O16mod_TestPattern8
### 2014.03.01 mod v2.1.0 - Fix Expr for CbCr conversion in PC Range(Y is not affected)
###                       - Add Parameters "dither", "interp" and "HQ" for U16
###                       - Delete Function U10, LowDepth and LowDepth16
### 2013.08.30 mod v2.0.0 - Change some parameters for SmoothAdjust v2.80 (interp->mode, smooth->interp, add HQ)
###                       - Add BitDepth using SmoothCurve/SmoothCurve16 for any conversion among 1-16 bit and TV/PC range
###                       - Rewrite LowDepth using SmoothCurve for converting 8bit to 1-8 bit
###                         (use mt_lut instead of Dither_lut16 to fix overflow issue and improve speed)
###                       - Add LowDepth16 using SmoothCurve16 for converting 16bit to 1-8 bit
### 2013.07.04 mod v1.7.0 - Fix Expr of SmoothCurve16 in Down10/U16/U10
###                         According to definition of YCbCr, Y don't have neutral point while CbCr always have neutral point
### 2013.01.21 mod v1.6.1 - Fix bugs of Down10 when "stack=False, dither=-1" or "dither>=0"
### 2013.01.05 mod v1.6.0 - Add U10 and Round10, speed optimization, using some functions from "dither" package
### 2012.04.03 v1.5.2     - Add LowDepth for fun, not fully implemented ( full range and speed optimization )
### 2012.03.25 v1.5.1     - Down10 now can directly output interleaved msb/lsb high bit depth clip
### 2012.03.14 v1.5.0     - Synchronize argument names with parameter names of f3kdb v1.5.0
### 2011.11.08 v1.3.2     - Replace all "dither" fuctions by "f3kdb"
###                         now it should be faster and uses less memory
###                         especially directly output high bit clip from TV range 8-bit clips with default settings
### 2011.11.05 v1.3.1     - Adjust f3kdb arguments to f3kdb version 1.4.1 and later
### 2011.10.31 v1.3 final - Use f3kdb to dither down, the result is more accurate
###                       - Separate TV range and PC range algorithm, and ensure that conversion is correct
###                       - Fix a bug in dithering down
###                       - Add U16 and C16
### 2011.09.27 v1.3 alpha - Rename "bitdepth" to "depth"
###                       - Add "dither" and "smooth", dangerous, no accuracy guaranteed
###                         Set "dither=-1, smooth=0" if you want old funcion, which does not apply any dithering or smoothing
###                       - Separate bit-depth downscaling function to "Down10()"
###                       - Restrict "depth" to [9, 16] in O16 and [8,16] in Down10
### 2011.08.11 v1.2       - "bitdepth" restricted up to 16
### 2011.08.09 v1.1       - Add "bitdepth" parameter to output self-defined bit depth
### 2011.08.05 v1.0       - First Script
###
###################################################################################################################################
###
### Requirements:
### "dither"       - [ 1.25.1 ~ ] : http://forum.doom9.org/showthread.php?p=1386559#post1386559
### "f3kdb"        - [ 1.5.1 ~  ] : http://forum.doom9.org/showthread.php?t=161411
### "SmoothAdjust" - [ 3.00  ~  ] : http://forum.doom9.org/showthread.php?t=154971
### "IshisashiAVS"
###
###################################################################################################################################
###
### Usage:
###
### BitDepth- get 1-8 bit / stacked 9-16 bit input clip and convert it to 1-16 bit output with SmoothCurve/SmoothCurve16.
### ------------
### input   - input clip, must be 1-16 bit clip.
###         - Defualt: not set
###  input_depth   -  input bit depth, range from 1 to 16.
###                - Defualt: 8
### output_depth   - output bit depth, range from 1 to 16.
###                - Defualt: input_depth
###  input_TVrange - processe the  input clip as TV Range or not.
###                - Default: True
### output_TVrange - processe the output clip as TV Range or not.
###                - Default: input_TVrange
###  input_LDPad   - define if  input low depth clip(1-7 bit) is padded to 8 bit - 0: None, 1: Bit Shift, 2:Normalization
###                - Default: 2
### output_LDPad   - define if output low depth clip(1-7 bit) is padded to 8 bit - 0: None, 1: Bit Shift, 2:Normalization
###                - Default: input_LDPad
### dither  - use dithering for conversion.
###         - when value is  -1, use Rounding.
###         - when value is   0, use Ordered-Dithering.
###         - when value is 100, use Noise.
###         - when value is in [1, 99], use Intermediary.
###         - Default: 0 for output_depth<=6 and 50 for output_depth>=7
### interp  - use gradient smoothing if output is a non 16-bit clip,
###         - explaination and strength defined in SmoothAdjust,
###         - do NOT have effect if dither<-1 or dither==-1 but input is TV range.
###         - Default: 0
### HQ      - enable high quality interpolation (slower)
###         - Default: False
### stack   - stacked msb/lsb (True) or interleaved msb/lsb (False) for 9-16bit output.
###         - Default: True
###
### ----------------------------------------------------------
###
### U16     - get 8-bit input clip and UP-convert it to stacked/interleaved 16 bit output.
### ------------
### input   - input clip, must be 8-bit clip.
###         - Defualt: not set
### TVrange - processe the clip as TV Range or not.
###         - Default: True
### stack   - output stacked msb/lsb (True) or interleaved msb/lsb (False).
###         - Default: True
###
### ----------------------------------------------------------
###
### C16     - get stacked input clip and CONVERT it to interleaved output, the same as Dither_convey_yuv4xxp16_on_yvxx.
### ------------
### input   - input clip.
###         - Defualt: not set
###
### ----------------------------------------------------------
###
### Round10 - get stacked 16-bit TVrange input clip and convert it Down to stacked 8-16 bit output with Rounding.
### ------------
### input   - input clip, must be stacked 16-bit TVrange clip.
###         - Defualt: not set
### depth   - output bit depth, range from 8 to 16.
###         - Defualt: 10
###
### ----------------------------------------------------------
###
### Down10  - get stacked 16-bit input clip and convert it DOWN to 8-16 bit output.
### ------------
### input   - input clip, must be 16-bit clip.
###         - Defualt: not set
### depth   - output bit depth, range from 8 to 16.
###         - Defualt: 10
### dither  - use dithering if output is a non 16-bit clip.
###         - when value is in [-1, 100], explaination and strength defined in SmoothAdjust.
###         - when value is -1, use Rounding.
###         - when value is -2, use Ordered dithering.
###         - when value is -3, use Floyd-Steinberg dithering.
###         - when value is -4, use Dither_quantize instead of f3kdb.
###         - Default: -3 for TV range and 50 for PC range
### ditherm - Dithering method for DitherPost/Dither_quantize:
###         - -1	no dither, round to the closest value
###         - 0		8-bit ordered dither + noise
###         - 1		1-bit dither
###         - 2		2-bit dither, light
###         - 3		2-bit dither, medium
###         - 4		2-bit dither, strong
###         - 5		2-bit dither, stronger
###         - 6		Serpentine Floyd-Steinberg error diffusion + noise. Well-balanced algorithm.
###         - 7		Stucki error diffusion + noise. Looks ¡°sharp¡± and preserve light edges and details well.
###         - 8		Atkinson error diffusion + noise. Generates distinct patterns but keeps clean the flat areas.
### interp  - use gradient smoothing if output is a non 16-bit clip,
###         - explaination and strength defined in SmoothAdjust,
###         - do NOT have effect if dither<-1 or dither==-1 but input is TV range.
###         - Default: 0
### HQ      - enable high quality interpolation (slower)
###         - Default: False
### TVrange - processe the clip as TV Range or not.
###         - Default: True
### stack   - stacked msb/lsb (True) or interleaved msb/lsb (False) for 9-16bit output.
###         - Default: True
###
### ----------------------------------------------------------
###
### O16     - get 8-bit input clip,
###         - process with 16-bit post-processing filters,
###         - OUTPUT interleaved 9-16 bit output,
###         - which can be passed to x264 directly.
###         - I will not add 8-bit output support in O16,
###         - since more checking in parameters will slow down O16 funcion and "U16().pp.Down10(8)" can easily do the same thing.
### ------------
### input   - input clip, must be 8-bit clip.
###         - Defualt: not set
### depth   - output bit depth, range from 9 to 16.
###         - Defualt: 16
### pp      - 16-bit precision post-processing defined by yourself.
###         - Defualt: not set ( no pp )
### dither  - use dithering if output is a non 16-bit clip and either "pp" is defined or TVrange is False.
###         - when value is in [-1, 100], explaination and strength defined in SmoothAdjust.
###         - when value is -2, use Ordered dithering.
###         - when value is -3, use Floyd-Steinberg dithering.
###         - when value is -4, use Dither_quantize instead of f3kdb.
###         - Default: -1 if output 16-bit clip or no pp applied, otherwise -3 for TV range and 50 for PC range
### ditherm - Dithering method for DitherPost/Dither_quantize:
###         - -1	no dither, round to the closest value
###         - 0		8-bit ordered dither + noise
###         - 1		1-bit dither
###         - 2		2-bit dither, light
###         - 3		2-bit dither, medium
###         - 4		2-bit dither, strong
###         - 5		2-bit dither, stronger
###         - 6		Serpentine Floyd-Steinberg error diffusion + noise. Well-balanced algorithm.
###         - 7		Stucki error diffusion + noise. Looks ¡°sharp¡± and preserve light edges and details well.
###         - 8		Atkinson error diffusion + noise. Generates distinct patterns but keeps clean the flat areas.
### interp  - use gradient smoothing if defined "pp" and output is a non 16-bit clip,
###         - explaination and strength defined in SmoothAdjust,
###         - do NOT have effect if dither<-1 or dither==-1 but input is TV range.
###         - Default: 0
### HQ      - enable high quality interpolation (slower)
###         - Default: False
### TVrange - processe the clip as TV Range or not.
###         - Default: True
###
###################################################################################################################################


Function BitDepth(clip input, int "input_depth", int "output_depth", bool "input_TVrange", bool "output_TVrange",
\                 int "input_LDPad", int "output_LDPad", int "dither", int "interp", bool "HQ", bool "stack")
{
    ###############################################################################################################################
    
    input_depth    = Default( input_depth,               8) # bit-depth of  input clip
    output_depth   = Default(output_depth,     input_depth) # bit-depth of output clip
    input_TVrange  = Default( input_TVrange,          True) # define if  input clip is of tv range(limited range)
    output_TVrange = Default(output_TVrange, input_TVrange) # define if output clip is of tv range(limited range)
    input_LDPad    = Default( input_LDPad,               2) # define if  input low depth clip(1-7 bit) is padded to 8 bit - 0: None, 1: Bit Shift, 2:Normalization
    output_LDPad   = Default(output_LDPad,     input_LDPad) # define if output low depth clip(1-7 bit) is padded to 8 bit - 0: None, 1: Bit Shift, 2:Normalization
	
    interp  = Default(interp,     0) # use interp or not for SmoothCurve/SmoothCurve16
    HQ      = Default(HQ,     False) # enable high quality interpolation (slower)
    dither  = Default(dither,     0) # -1 for no dither, 0 for ordered-dither, 1-100 for noise strength
    stack   = Default(stack,   True) # stacked msb/lsb or interleaved msb/lsb for 9-16 bit output
    
    input_LDPad    =  input_depth<8 ?  input_LDPad : 0
    output_LDPad   = output_depth<8 ? output_LDPad : 0
	
    Assert( input_depth<=16 &&  input_depth>=1, """BitDepth:  "input_depth" ranges from 1 to 16!""")
    Assert(output_depth<=16 && output_depth>=1, """BitDepth: "output_depth" ranges from 1 to 16!""")
    Assert(dither>=-1 && dither<=100,           """BitDepth: "dither" ranges from -1 to 100!"""    )
    
    ###############################################################################################################################
    
    hp             = input_depth>8 || output_depth>8
    
    input_shift    = Pow  (2,  input_depth - 8)
    input_neutral  = Round(128. *  input_shift)
    input_Yfloor   =  input_TVrange ? Round( 16. *  input_shift) : 0
    input_Cfloor   =  input_TVrange ? Round( 16. *  input_shift) : 0.5
    input_Yceil    =  input_TVrange ? Round(235. *  input_shift) : Round(Pow(2,  input_depth) - 1  )
    input_Cceil    =  input_TVrange ? Round(240. *  input_shift) :       Pow(2,  input_depth) - 0.5
    
    output_shift   = Pow  (2, output_depth - 8)
    output_neutral = Round(128. * output_shift)
    output_Yfloor  = output_TVrange ? Round( 16. * output_shift) : 0
    output_Cfloor  = output_TVrange ? Round( 16. * output_shift) : 0.5
    output_Yceil   = output_TVrange ? Round(235. * output_shift) : Round(Pow(2, output_depth) - 1  )
    output_Cceil   = output_TVrange ? Round(240. * output_shift) :       Pow(2, output_depth) - 0.5
    
    input_ul       = Round(Pow(2,  input_depth) - 1  )
    output_ul      = Round(Pow(2, output_depth) - 1  )
    input_Cceil1   = (output_ul-output_neutral) / (output_Cceil-output_neutral) * (input_Cceil-input_neutral) +  input_neutral
    output_Cceil1  =  output_ul
    input_Cceil2   =   input_ul
    output_Cceil2  = ( input_ul- input_neutral) / (input_Cceil-input_neutral) * (output_Cceil-output_neutral) + output_neutral
    
    input_Cceil    = output_Cceil > output_ul ? input_Cceil > input_ul ? Min( input_Cceil1,  input_Cceil2)
    \                                                                  :      input_Cceil1
    \                                         : input_Cceil > input_ul ?                     input_Cceil2
    \                                                                  :  input_Cceil
    output_Cceil   = output_Cceil > output_ul ? input_Cceil > input_ul ? Min(output_Cceil1, output_Cceil2)
    \                                                                  :     output_Cceil1
    \                                         : input_Cceil > input_ul ?                    output_Cceil2
    \                                                                  : output_Cceil
	
    upper_limit    = hp ? 65535 : 255
    enable_Yul     = upper_limit > input_Yceil
    enable_Cul     = upper_limit > input_Cceil
    
    ###############################################################################################################################
    
	Yexpr1  =  input_LDPad>=2 ?  input_TVrange ? "x  16 - "+String( input_Yceil- input_Yfloor)+" * 219 / "+String( input_Yfloor )+" +"
	\                                          : "x   0 - "+String( input_Yceil- input_Yfloor)+" * 255 / "+String( input_Yfloor )+" +"
	\                         :                  "x "+String(8- input_depth)+" >>"
	
	Cexpr1  =  input_LDPad>=2 ?  input_TVrange ? "x 128 - "+String( input_Cceil- input_Cfloor)+" * 224 / "+String( input_neutral)+" +"
	\                                          : "x 128 - "+String( input_Cceil- input_Cfloor)+" * 255 / "+String( input_neutral)+" +"
	\                         :                  "x "+String(8- input_depth)+" >>"
	
	
	Yexpr2  = String(input_Yfloor)+"-"+String(output_Yfloor)+";"+String( input_Yceil )+"-"+String(output_Yceil  )
	Yexpr2  = input_TVrange ? "0-"+String(output_Yfloor)+";"+Yexpr2 : Yexpr2
	Yexpr2  = enable_Yul    ? Yexpr2+";"+String(upper_limit)+"-"+String(output_Yceil ) : Yexpr2
	
	Cexpr2  = String(input_Cfloor)+"-"+String(output_Cfloor)+";"+String(input_neutral)+"-"+String(output_neutral)+";"+String(input_Cceil)+"-"+String(output_Cceil)
	Cexpr2  =                 "0-"+String(output_Cfloor)+";"+Cexpr2
	Cexpr2  = enable_Cul    ? Cexpr2+";"+String(upper_limit)+"-"+String(output_Cceil ) : Cexpr2
    
	
	Yexpr3  = output_LDPad>=2 ? output_TVrange ? "x "+String(output_Yfloor )+" - "+String(output_Yceil-output_Yfloor)+" / 219 *  16 +"
	\                                          : "x "+String(output_Yfloor )+" - "+String(output_Yceil-output_Yfloor)+" / 255 *   0 +"
	\                         :                  "x "+String(8-output_depth)+" <<"
	
	Cexpr3  = output_LDPad>=2 ? output_TVrange ? "x "+String(output_neutral)+" - "+String(output_Cceil-output_Cfloor)+" / 224 * 128 +"
	\                                          : "x "+String(output_neutral)+" - "+String(output_Cceil-output_Cfloor)+" / 255 * 128 +"
	\                         :                  "x "+String(8-output_depth)+" <<"
	
    ###############################################################################################################################
    
    pre     =  input_LDPad>=1 ?  input.mt_lut(yexpr=Yexpr1, uexpr=Cexpr1, vexpr=Cexpr1, Y=3, U=3, V=3) :  input
    pre     = hp &&  input_depth<=8 ? StackVertical(pre.Dither_gen_null_lsb(), pre) : pre
    
    smoothC = hp ? pre.iSmoothCurve16(Ycurve=Yexpr2, Ucurve=Cexpr2, Vcurve=Cexpr2, mode=0, interp=interp, HQ=HQ,
    \                                 dither=dither, limiter=False, TVrange=0)
    \            : pre.iSmoothCurve  (Ycurve=Yexpr2, Ucurve=Cexpr2, Vcurve=Cexpr2, mode=0, interp=interp, HQ=HQ,
    \                                 dither=dither, limiter=False, TVrange=0)
	
    output  = hp && output_depth<=8 ? smoothC.Dither_get_lsb() : smoothC
    output  = output_LDPad>=1 ? output.mt_lut(yexpr=Yexpr3, uexpr=Cexpr3, vexpr=Cexpr3, Y=3, U=3, V=3) : output
    output  = output_depth>8 && !stack ? output.Dither_out() : output
    
    ###############################################################################################################################
    
    return input_depth==output_depth && input_TVrange==output_TVrange && input_LDPad==output_LDPad ? input : output
}

###################################################################################################################################

Function U16(clip input, bool "TVrange", int "dither", int "interp", bool "HQ", bool "stack")
{ 
    TVrange = Default(TVrange, True) # define if input clip is of tv range(limited range)
    
    interp  = Default(interp,     0) # use interp or not for SmoothCurve/SmoothCurve16
    HQ      = Default(HQ,     False) # enable high quality interpolation (slower)
    dither  = Default(dither,    -1) # -1 for no dither, 0 for ordered-dither, 1-100 for noise strength
    stack   = Default(stack,   True) # output stacked msb/lsb or interleaved msb/lsb
    
    oCceil   = (255-128) / (255.5-128) * (65535.5-32768) + 32768
    
    Yexpr    = "0-0  ;                  255-65535             ;65535-65535          "
    Cexpr    = "0-0.5;0.5-0.5;128-32768;255-"+String(oCceil)+";65535-"+String(oCceil)
    
    up      =  TVrange ? input.Dither_convert_8_to_16()
    \                  : StackVertical(input.Dither_gen_null_lsb(), input)
	\                   .iSmoothCurve16(Ycurve=Yexpr, Ucurve=Cexpr, Vcurve=Cexpr, mode=0, interp=interp, HQ=HQ,
    \                                   dither=dither, limiter=False, TVrange=0)
    
    return stack ? up : up.Dither_out()
}


Function C16(clip input)
{
    return IsAVSPlus() ? input.ConvertFromStacked().ConvertToDoubleWidth()
    \                  : input.Dither_out()
}


Function Round10(clip input, int "depth")
{
    depth   = Default(depth,     10) # bit-depth of output clip
    
    Assert(depth>=8   && depth<=16   , """Round10: "depth" ranges from 8 to 16!""")
    
    divisor = Round(Pow( 2, 16-depth ))
    
    return depth==16 ? input : depth==8 ? input.DitherPost(mode=-1) : input.Dither_lut16("x " +String(divisor)+ " /", U=3, V=3)
}

###################################################################################################################################

Function Down10(clip input, int "depth", bool "TVrange", int "dither", int "ditherm", int "interp", bool "HQ", bool "stack")
{
    ###############################################################################################################################
    
    depth   = Default(depth,     10) # bit-depth of output clip
    TVrange = Default(TVrange, True) # define if input clip is of tv range(limited range)
    interp  = Default(interp,     0) # use interp or not for SmoothCurve/SmoothCurve16
    HQ      = Default(HQ,     False) # enable high quality interpolation (slower)
    dither  = TVrange ? Default(dither, -3) : Default(dither, 50) # use dither or not, -4 use Dither_quantize instead of f3kdb
    ditherm = Default(ditherm,    6) # dither mode for DitherPost/Dither_quantize
    stack   = Default(stack,   True) # stacked msb/lsb or interleaved msb/lsb for 9-16 bit output
    
    Assert(depth>=8   && depth<=16   , """Down10: "depth" ranges from 8 to 16!"""   )
    Assert(dither>=-4 && dither<=100 , """Down10: "dither" ranges from -4 to 100!""")
    Assert(ditherm>=-1 && ditherm<=8 , """Down10: "ditherm" ranges from -1 to 8!""" )
    Assert(!(dither==-4 && depth==15), """Down10: "depth" can't be 15 when "dither" is -4""")
    
    ###############################################################################################################################
    
	input_depth    = 16
	output_depth   = depth
	input_TVrange  = TVrange
	output_TVrange = TVrange
	
    hp             = input_depth>8 || output_depth>8
    
    input_shift    = Pow  (2,  input_depth - 8)
    input_neutral  = Round(128. *  input_shift)
    input_Yfloor   =  input_TVrange ? Round( 16. *  input_shift) : 0
    input_Cfloor   =  input_TVrange ? Round( 16. *  input_shift) : 0.5
    input_Yceil    =  input_TVrange ? Round(235. *  input_shift) : Round(Pow(2,  input_depth) - 1  )
    input_Cceil    =  input_TVrange ? Round(240. *  input_shift) :       Pow(2,  input_depth) - 0.5
    
    output_shift   = Pow  (2, output_depth - 8)
    output_neutral = Round(128. * output_shift)
    output_Yfloor  = output_TVrange ? Round( 16. * output_shift) : 0
    output_Cfloor  = output_TVrange ? Round( 16. * output_shift) : 0.5
    output_Yceil   = output_TVrange ? Round(235. * output_shift) : Round(Pow(2, output_depth) - 1  )
    output_Cceil   = output_TVrange ? Round(240. * output_shift) :       Pow(2, output_depth) - 0.5
    
	input_ul       = Round(Pow(2,  input_depth) - 1  )
    output_ul      = Round(Pow(2, output_depth) - 1  )
    input_Cceil1   = (output_ul-output_neutral) / (output_Cceil-output_neutral) * (input_Cceil-input_neutral) +  input_neutral
    output_Cceil1  =  output_ul
    input_Cceil2   =   input_ul
    output_Cceil2  = ( input_ul- input_neutral) / (input_Cceil-input_neutral) * (output_Cceil-output_neutral) + output_neutral
    
    input_Cceil    = output_Cceil > output_ul ? input_Cceil > input_ul ? Min( input_Cceil1,  input_Cceil2)
    \                                                                  :      input_Cceil1
    \                                         : input_Cceil > input_ul ?                     input_Cceil2
    \                                                                  :  input_Cceil
    output_Cceil   = output_Cceil > output_ul ? input_Cceil > input_ul ? Min(output_Cceil1, output_Cceil2)
    \                                                                  :     output_Cceil1
    \                                         : input_Cceil > input_ul ?                    output_Cceil2
    \                                                                  : output_Cceil
	
    upper_limit    = hp ? 65535 : 255
    enable_Yul     = upper_limit > input_Yceil
    enable_Cul     = upper_limit > input_Cceil
	
    ###############################################################################################################################
    
	Yexpr   = String(input_Yfloor)+"-"+String(output_Yfloor)+";"+String( input_Yceil )+"-"+String(output_Yceil  )
	Yexpr   = TVrange    ? "0-"+String(output_Yfloor)+";"+Yexpr : Yexpr
	Yexpr   = enable_Yul ? Yexpr+";"+String(upper_limit)+"-"+String(output_Yceil ) : Yexpr
	
	Cexpr   = String(input_Cfloor)+"-"+String(output_Cfloor)+";"+String(input_neutral)+"-"+String(output_neutral)+";"+String(input_Cceil)+"-"+String(output_Cceil)
	Cexpr   =              "0-"+String(output_Cfloor)+";"+Cexpr
	Cexpr   = enable_Cul ? Cexpr+";"+String(upper_limit)+"-"+String(output_Cceil ) : Cexpr
	
    ###############################################################################################################################
    
    smoothD = input.iSmoothCurve16(Ycurve=Yexpr, Ucurve=Cexpr, Vcurve=Cexpr, mode=0, interp=interp, HQ=HQ,
    \                              dither=(dither>-1 ? dither : -1), limiter=False, TVrange=0)
    
    ditherD = dither==-4 ? stack ? input.Dither_quantize(depth, reducerange=True, mode=ditherm)
    \                            : input.Dither_quantize(depth, reducerange=True, mode=ditherm).C16()
    \       : dither>=-1 ? stack ? input.Round10(depth=depth) : input.Round10(depth=depth).C16()
    \                    :         input.f3kdb(Y=0, Cb=0, Cr=0, grainY=0, grainC=0, dither_algo=(-dither), input_mode=1,
    \                                          output_depth=depth, output_mode=(depth>8 ? stack ? 1 : 2 : 0))
    
    down    = dither<-1 || (dither==-1 && interp==0 && TVrange) ? depth==8 ? input.DitherPost(mode=ditherm)
    \                                                                      : ditherD
    \                                                           : depth==8 ? smoothD.Dither_get_lsb()
    \                                                                      : stack ? smoothD
    \                                                                              : smoothD.C16()
    
    ###############################################################################################################################
    
    return depth==16 ? stack ? input : input.C16() : down
}

###################################################################################################################################

Function O16(clip input, int "depth", bool "TVrange", string "pp", int "dither", int "ditherm", int "interp", bool "HQ")
{
    depth   = Default(depth,     16) # bit-depth of output clip
    TVrange = Default(TVrange, True) # define if input clip is of tv range(limited range)
    interp  = Default(interp,     0) # use interp or not for SmoothCurve/SmoothCurve16
    HQ      = Default(HQ,     False) # enable high quality interpolation (slower)
    dither  = TVrange ? Default(dither, -3) : Default(dither, 50) # use dither or not, -4 use Dither_quantize instead of f3kdb
    ditherm = Default(ditherm,    6) # dither mode for DitherPost/Dither_quantize
    
    Assert(depth>8 && depth<=16      , """O16: "depth" ranges from 9 to 16!"""   )
    Assert(dither>=-4 && dither<=100 , """O16: "dither" ranges from -4 to 100!""")
    Assert(ditherm>=-1 && ditherm<=8 , """O16: "ditherm" ranges from -1 to 8!""" )
    Assert(!(dither==-4 && depth==15), """O16: "depth" can't be 15 when "dither" is -4""")
    
    input.U16(TVrange=TVrange)
	
    pp16    = Defined(pp) ? Eval(pp) : last
    
    return !Defined(pp) ? input.BitDepth(8, depth, TVrange, TVrange, dither=dither,                  interp=interp, HQ=HQ, stack=False)
    \      : depth==16  ? pp16 .C16()
    \                   : pp16 .Down10(depth=depth, TVrange=TVrange, dither=dither, ditherm=ditherm, interp=interp, HQ=HQ, stack=False)
}

###################################################################################################################################

Function O16mod_TestPattern8(string "pixel_type")
{
    pixel_type = Default(pixel_type, VersionNumber() >= 2.6 ? "YV24" : "YV12")
    
    x1y1    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$008080)
    x1y2    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$018080)
    x1y3    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$108080)
    x1y4    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$408080)
    x1y5    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$808080)
    x1y6    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$C08080)
    x1y7    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$EB8080)
    x1y8    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$FE8080)
    x1y9    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$FF8080)
    x1      = StackVertical(x1y1, x1y2, x1y3, x1y4, x1y5, x1y6, x1y7, x1y8, x1y9)
    
    x2y1    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$800080)
    x2y2    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$800180)
    x2y3    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$801080)
    x2y4    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$804080)
    x2y5    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$808080)
    x2y6    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$80C080)
    x2y7    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$80F080)
    x2y8    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$80FE80)
    x2y9    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$80FF80)
    x2      = StackVertical(x2y1, x2y2, x2y3, x2y4, x2y5, x2y6, x2y7, x2y8, x2y9)
    
    x3y1    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$808000)
    x3y2    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$808001)
    x3y3    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$808010)
    x3y4    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$808040)
    x3y5    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$808080)
    x3y6    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$8080C0)
    x3y7    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$8080F0)
    x3y8    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$8080FE)
    x3y9    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$8080FF)
    x3      = StackVertical(x3y1, x3y2, x3y3, x3y4, x3y5, x3y6, x3y7, x3y8, x3y9)
    
    return StackHorizontal(x1, x2, x3)
}


Function O16mod_TestPattern16(string "pixel_type")
{
    pixel_type = Default(pixel_type, VersionNumber() >= 2.6 ? "YV24" : "YV12")
    
    x1y1    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$008080)
    x1y2    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$008080)
    x1y3    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$108080)
    x1y4    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$408080)
    x1y5    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$808080)
    x1y6    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$C08080)
    x1y7    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$EB8080)
    x1y8    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$FF8080)
    x1y9    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$FF8080)
    x1      = StackVertical(x1y1, x1y2, x1y3, x1y4, x1y5, x1y6, x1y7, x1y8, x1y9)
    
    x2y1    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$800080)
    x2y2    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$800080)
    x2y3    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$801080)
    x2y4    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$804080)
    x2y5    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$808080)
    x2y6    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$80C080)
    x2y7    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$80F080)
    x2y8    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$80FF80)
    x2y9    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$80FF80)
    x2      = StackVertical(x2y1, x2y2, x2y3, x2y4, x2y5, x2y6, x2y7, x2y8, x2y9)
    
    x3y1    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$808000)
    x3y2    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$808000)
    x3y3    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$808010)
    x3y4    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$808040)
    x3y5    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$808080)
    x3y6    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$8080C0)
    x3y7    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$8080F0)
    x3y8    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$8080FF)
    x3y9    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$8080FF)
    x3      = StackVertical(x3y1, x3y2, x3y3, x3y4, x3y5, x3y6, x3y7, x3y8, x3y9)
    
    msb     = StackHorizontal(x1, x2, x3)
    
    x1y1    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x1y2    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$010000)
    x1y3    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x1y4    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x1y5    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x1y6    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x1y7    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x1y8    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$FE0000)
    x1y9    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$FF0000)
    x1      = StackVertical(x1y1, x1y2, x1y3, x1y4, x1y5, x1y6, x1y7, x1y8, x1y9)
    
    x2y1    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x2y2    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000100)
    x2y3    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x2y4    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x2y5    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x2y6    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x2y7    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x2y8    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$00FE00)
    x2y9    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$00FF00)
    x2      = StackVertical(x2y1, x2y2, x2y3, x2y4, x2y5, x2y6, x2y7, x2y8, x2y9)
    
    x3y1    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x3y2    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000001)
    x3y3    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x3y4    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x3y5    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x3y6    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x3y7    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$000000)
    x3y8    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$0000FE)
    x3y9    = BlankClip(1000, 360, 120, pixel_type, 24000, 1001, color_yuv=$0000FF)
    x3      = StackVertical(x3y1, x3y2, x3y3, x3y4, x3y5, x3y6, x3y7, x3y8, x3y9)
    
    lsb     = StackHorizontal(x1, x2, x3)
    
    return StackVertical(msb, lsb)
}
