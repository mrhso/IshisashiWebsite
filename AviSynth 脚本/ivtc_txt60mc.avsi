# Version 1.1
Function ivtc_txt60mc (clip src, int frame_ref, bool "srcbob", bool "draft")
{
	srcbob    = Default (srcbob, false)
	draft     = Default (draft,  false)

	field_ref = (srcbob) ? frame_ref : frame_ref * 2
	field_ref =      field_ref  % 5
	invpos    = (5 - field_ref) % 5
	pel       = (draft) ? 1 : 2

	src
	  (srcbob) ? last
\	: (draft ) ? Bob ()
\	:            QTGMC (SourceMatch=3, Lossless=2, tr0=1, tr1=1, tr2=1)

	clean  = SelectEvery (5, 1 - invpos)
	jitter = SelectEvery (5, 3 - invpos, 4 - invpos)
	jsup   = jitter.MSuper (pel=pel)
	vect_f = jsup.MAnalyse (isb=false, delta=1, overlap=4)
	vect_b = jsup.MAnalyse (isb=true,  delta=1, overlap=4)
	comp   = jitter.MFlowInter (jsup, vect_b, vect_f, time=50, thSCD1=400)
	fixed  = comp.SelectEvery (2, 0)
	Interleave (clean, fixed)
	Trim (invpos / 2, 0)
}
