'use strict';

const fs = require('fs');
const { parseWAV, parseFmt, writeWAV, writeFmt } = require('../wavHandler.js');
const ffi = require('ffi-napi');
const ref = require('ref-napi');
const StructType = require('ref-struct-di')(ref);
const ArrayType = require('ref-array-di')(ref);

let api = 'soxr.dll';
let rate = 48000;

let files = ['th07_13b'];
let del = [];

const soxr_quality_spec_t = StructType({
    precision: ref.types.double,
    phase_response: ref.types.double,
    passband_end: ref.types.double,
    stopband_begin: ref.types.double,
    e: ref.refType(ref.types.void),
    flags: ref.types.ulong,
});

const soxr_io_spec_t = StructType({
    itype: ref.types.int,
    otype: ref.types.int,
    scale: ref.types.double,
    e: ref.refType(ref.types.void),
    flags: ref.types.ulong,
});

const soxr_runtime_spec_t = StructType({
    log2_min_dft_size: ref.types.uint,
    log2_large_dft_size: ref.types.uint,
    coef_size_kbytes: ref.types.uint,
    num_threads: ref.types.uint,
    e: ref.refType(ref.types.void),
    flags: ref.types.ulong,
});

const soxr_error_t = ref.refType(ref.types.char);
const soxr_input_fn_t = ffi.Function(ref.refType(ref.types.size_t), [ref.refType(ref.types.void), ref.refType(ref.refType(ref.types.void)), ref.types.size_t]);
const resampler_shared_t = ref.refType(ref.types.void);
const resampler_t = ref.refType(ref.types.void);
const control_block_t = ArrayType(ffi.Function(ref.refType(ref.types.void), [ref.types.void]), 10);
const deinterleave_t = ffi.Function(ref.refType(ref.types.void), [ref.refType(ref.refType(ref.types.void)), ref.types.int, ref.refType(ref.refType(ref.types.void)), ref.types.size_t, ref.types.uint]);
const interleave_t = ffi.Function(ref.refType(ref.types.void), [ref.types.int, ref.refType(ref.refType(ref.types.void)), ref.refType(ref.refType(ref.types.void)), ref.types.size_t, ref.types.uint, ref.refType(ref.types.long)]);

const soxr_t = ref.refType(StructType({
    num_channels: ref.types.uint,
    io_ratio: ref.types.double,
    error: soxr_error_t,
    q_spec: soxr_quality_spec_t,
    io_spec: soxr_io_spec_t,
    runtime_spec: soxr_runtime_spec_t,
    input_fn_state: ref.refType(ref.types.void),
    input_fn: soxr_input_fn_t,
    max_ilen: ref.types.size_t,
    shared: resampler_shared_t,
    resamples: ref.refType(resampler_t),
    control_block: control_block_t,
    deinterleave: deinterleave_t,
    interleave: interleave_t,
    channel_ptrs: ref.refType(ref.refType(ref.types.void)),
    clips: ref.types.size_t,
    seed: ref.types.ulong,
    flushing: ref.types.int,
}));

const soxr = ffi.Library(api, {
    soxr_quality_spec: [soxr_quality_spec_t, [ref.types.ulong, ref.types.ulong]],
    soxr_io_spec: [soxr_io_spec_t, [ref.types.int, ref.types.int]],
    soxr_runtime_spec: [soxr_runtime_spec_t, [ref.types.uint]],
    soxr_create: [soxr_t, [ref.types.double, ref.types.double, ref.types.uint, ref.refType(soxr_error_t), ref.refType(soxr_io_spec_t), ref.refType(soxr_quality_spec_t), ref.refType(soxr_runtime_spec_t)]],
    soxr_set_input_fn: [soxr_error_t, [soxr_t, soxr_input_fn_t, ref.refType(ref.types.void), ref.types.size_t]],
    soxr_engine: [ref.refType(ref.types.char), [soxr_t]],
    soxr_output: [ref.types.size_t, [soxr_t, ref.refType(ref.types.void), ref.types.size_t]],
});

// SOXR_32_BITQ
let q_spec = soxr.soxr_quality_spec(7, 0);
// 32-bit 浮点
let io_spec = soxr.soxr_io_spec(0, 0);
// 单线程
let runtime_spec = soxr.soxr_runtime_spec(1);
let error = ref.alloc(soxr_error_t).deref();

const input_context_t = StructType({
    ibuf: ref.refType(ref.types.void),
    isize: ref.types.size_t,
});

const input_fn = ffi.Callback(ref.types.size_t, [ref.refType(input_context_t), ref.refType(ref.refType(ref.types.void)), ref.types.size_t], (p, buf, len) => {
    buf = p.deref().ibuf;
    return len;
});

for (let file of files) {
    console.log(`${file}.wav`);
    let wav = parseWAV(fs.readFileSync(`${file}.wav`));
    let fmt = parseFmt(wav['fmt ']);

    if (!(fmt.wFormatTag === 3 && fmt.wBitsPerSample === 32 || fmt.wFormatTag === 65534 && fmt.wBitsPerSample === 32 && fmt.extra.subFormat === '0300000000001000800000aa00389b71')) {
        throw '不支援的档案';
    };

    if (fmt.nSamplesPerSec === rate) {
        console.log('采样率不变，已排除');
        continue;
    };

    delete wav.fact;
    let fact = wav.order.indexOf('fact');
    if (fact > -1) {
        wav.order.splice(fact, 1);
    };

    let data = wav.data;
    let dataResampled = Buffer.alloc(Math.round(data.length / fmt.nBlockAlign * rate / fmt.nSamplesPerSec) * fmt.nBlockAlign);
    let ibuf = data.ref();
    let obuf = dataResampled.ref();
    ibuf.type = ref.refType(ref.types.void);
    obuf.type = ref.refType(ref.types.void);

    let icontext = ref.alloc(input_context_t).deref();
    let resampler = soxr.soxr_create(fmt.nSamplesPerSec, rate, fmt.nChannels, error.ref(), io_spec.ref(), q_spec.ref(), runtime_spec.ref());
    icontext.ibuf = ibuf;
    icontext.isize = fmt.nBlockAlign;
    soxr.soxr_set_input_fn(resampler, input_fn, icontext.ref(), data.length / fmt.nBlockAlign);
    let engine = soxr.soxr_engine(resampler);
    // 到这一步会因为不明原因退出，有待解决
    let odone = soxr.soxr_output(resampler, obuf, dataResampled.length / fmt.nBlockAlign);

    fmt.nSamplesPerSec = rate;
    fmt.nAvgBytesPerSec = fmt.nSamplesPerSec * fmt.nBlockAlign;
    wav['fmt '] = writeFmt(fmt);

    wav = writeWAV(wav);
    // fs.writeFileSync(`${file}-resampled.wav`, wav);
};
