
# This program is free software. It comes without any warranty, to
# the extent permitted by applicable law. You can redistribute it
# and/or modify it under the terms of the Do What The Fuck You Want
# To Public License, Version 2, as published by Sam Hocevar. See
# http://sam.zoy.org/wtfpl/COPYING for more details.

#=============================================================================
#	mt_expand_multi
#	mt_inpand_multi
#
#	Calls mt_expand or mt_inpand multiple times in order to grow or shrink
#	the mask from the desired width and height.
#
#	Parameters:
#	- sw   : Growing/shrinking shape width. 0 is allowed. Default: 1
#	- sh   : Growing/shrinking shape height. 0 is allowed. Default: 1
#	- mode : "rectangle" (default), "ellipse" or "losange". Replaces the
#		mt_xxpand mode. Ellipses are actually combinations of
#		rectangles and losanges and look more like octogons.
#		Losanges are truncated (not scaled) when sw and sh are not
#		equal.
#	Other parameters are the same as mt_xxpand.
#=============================================================================

Function mt_expand_multi (clip src, int "thY", int "thC", string "mode",
\	int "offx", int "offy", int "w", int "h", int "y", int "u", int "v",
\	string "chroma", int "sw", int "sh")
{
	sw   = Default (sw, 1)
	sh   = Default (sh, 1)
	mode = Default (mode, "rectangle")

	mode_m =
\	  (sw > 0 && sh > 0) ? (
\		  (mode == "losange" || (mode == "ellipse" && (sw % 3) != 1))
\		? "both" : "square"
\	                       )
\	: (sw > 0          ) ? "horizontal"
\	: (          sh > 0) ? "vertical"
\	:                      ""

	(mode_m != "") ? src.mt_expand (
\		thY=thY, thC=thC, mode=mode_m,
\		offx=offx, offy=offy, w=w, h=h, y=y, u=u, v=v, chroma=chroma
\	).mt_expand_multi (
\		thY=thY, thC=thC, mode=mode,
\		offx=offx, offy=offy, w=w, h=h, y=y, u=u, v=v, chroma=chroma,
\		sw=sw-1, sh=sh-1
\	) : src
}

Function mt_inpand_multi (clip src, int "thY", int "thC", string "mode",
\	int "offx", int "offy", int "w", int "h", int "y", int "u", int "v",
\	string "chroma", int "sw", int "sh")
{
	sw   = Default (sw, 1)
	sh   = Default (sh, 1)
	mode = Default (mode, "rectangle")

	mode_m =
\	  (sw > 0 && sh > 0) ? (
\		  (mode == "losange" || (mode == "ellipse" && (sw % 3) != 1))
\		? "both" : "square"
\	                       )
\	: (sw > 0          ) ? "horizontal"
\	: (          sh > 0) ? "vertical"
\	:                      ""

	(mode_m != "") ? src.mt_inpand (
\		thY=thY, thC=thC, mode=mode_m,
\		offx=offx, offy=offy, w=w, h=h, y=y, u=u, v=v, chroma=chroma
\	).mt_inpand_multi (
\		thY=thY, thC=thC, mode=mode,
\		offx=offx, offy=offy, w=w, h=h, y=y, u=u, v=v, chroma=chroma,
\		sw=sw-1, sh=sh-1
\	) : src
}

