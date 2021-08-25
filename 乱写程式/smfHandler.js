'use strict';

const parseVLQ = (buf) => {
    let offset = 0;
    let num = 0;
    while (offset < buf.length) {
        num += (buf[offset] & 0x7F) << (buf.length - offset - 1) * 7;
        offset += 1;
    };
    return num;
};

const parseTrack = (buf) => {
    let events = [];
    let offset = 0;
    let time = 0;
    while (offset < buf.length) {
        let event = {};
        let deltaSize = 0;
        while (buf[offset + deltaSize] >> 7) {
            deltaSize += 1;
        };
        deltaSize += 1;
        let delta = parseVLQ(buf.slice(offset, offset + deltaSize));
        offset += deltaSize;
        time += delta;
        event.time = time;
        let type8 = buf[offset];
        let type4 = type8 >> 4;
        // Note Off
        if (type4 === 0x8) {
            event.event = buf.slice(offset, offset + 3);
            offset += 3;
        // Note On
        } else if (type4 === 0x9) {
            event.event = buf.slice(offset, offset + 3);
            offset += 3;
        // Polyphonic Key Pressure
        } else if (type4 === 0xA) {
            event.event = buf.slice(offset, offset + 3);
            offset += 3;
        // Control Change / Channel Mode Messages
        } else if (type4 === 0xB) {
            event.event = buf.slice(offset, offset + 3);
            offset += 3;
        // Program Change
        } else if (type4 === 0xC) {
            event.event = buf.slice(offset, offset + 2);
            offset += 2;
        // Channel Pressure
        } else if (type4 === 0xD) {
            event.event = buf.slice(offset, offset + 2);
            offset += 2;
        // Pitch Bend Change
        } else if (type4 === 0xE) {
            event.event = buf.slice(offset, offset + 3);
            offset += 3;
        // SysEx
        } else if (type8 === 0xF0) {
            let length = buf[offset + 1];
            event.event = buf.slice(offset, offset + length + 2);
            offset += length + 2;
        // SysEx
        } else if (type8 === 0xF7) {
            let length = buf[offset + 1];
            event.event = buf.slice(offset, offset + length + 2);
            offset += length + 2;
        // Meta
        } else if (type8 === 0xFF) {
            let length = buf[offset + 2];
            event.event = buf.slice(offset, offset + length + 3);
            offset += length + 3;
        };
        events.push(event);
    };
    return events;
};

const parseTracks = (buf, ntrks) => {
    let tracks = [];
    let num = 0;
    let offset = 0;
    while (num < ntrks) {
        let magic = buf.slice(offset, offset + 4).toString();
        if (magic !== 'MTrk') {
            throw '数据非音轨';
        };
        offset += 4;
        let trackSize = buf.readUInt32BE(offset);
        offset += 4;
        let track = buf.slice(offset, offset + trackSize);
        offset += trackSize;
        tracks.push(parseTrack(track));
        num += 1;
    };
    return tracks;
};

const parseSMF = (buf) => {
    let magic = buf.slice(0, 4).toString();
    if (magic !== 'MThd') {
        throw '档案非 SMF';
    };
    let chunks = {};
    let headerSize = buf.readUInt32BE(4, 8);
    let header = buf.slice(8, headerSize + 8);
    let offset = 0;
    let headerInfo = ['format', 'ntrks', 'division'];
    let ntrks = 1;
    while (offset < header.length) {
        if (offset === 2) {
            ntrks = header.readUInt16BE(offset);
        } else if (offset === 4) {
            chunks.division = header.readInt16BE(offset);
            chunks.SMPTE = chunks.division < 0;
            chunks.division = Math.abs(chunks.division);
        } else {
            chunks[headerInfo[offset / 2]] = header.readUInt16BE(offset);
        };
        offset += 2;
    };
    chunks.tracks = parseTracks(buf.slice(headerSize + 8, buf.length), ntrks);
    return chunks;
};

const writeVLQ = (num) => {
    let buf = [];
    if (num === 0) {
        buf.push(0);
    };
    while (num > 0) {
        buf.push(num & 0x7F);
        num >>= 7;
    };
    let offset = 1;
    while (offset < buf.length) {
        buf[offset] += 0x80;
        offset += 1;
    };
    buf.reverse();
    return Buffer.from(buf);
};

const writeTrack = (arr) => {
    let events = [];
    let time = 0;
    for (let event of arr) {
        let delta = event.time - time;
        events.push(writeVLQ(delta));
        time = event.time;
        events.push(event.event);
    };
    return Buffer.concat(events);
};

const writeTracks = (arr) => {
    let tracks = [];
    for (let track of arr) {
        let magic = Buffer.alloc(4);
        magic.write('MTrk');
        let trackSize = Buffer.alloc(4);
        let buf = writeTrack(track);
        trackSize.writeUInt32BE(buf.length);
        tracks.push(magic, trackSize, buf);
    };
    return Buffer.concat(tracks);
};

const writeSMF = (obj) => {
    let magic = Buffer.alloc(4);
    magic.write('MThd');
    let headerSize = Buffer.alloc(4);
    let header = [];
    let headerInfo = ['format', 'ntrks', 'division'];
    for (let info of headerInfo) {
        if (info === 'ntrks') {
            let buf = Buffer.alloc(2);
            buf.writeUInt16BE(obj.tracks.length);
            header.push(buf);
        } else if (info === 'division') {
            let buf = Buffer.alloc(2);
            buf.writeInt16BE(obj.SMPTE ? -obj[info] : obj[info]);
            header.push(buf);
        } else if (obj[info] !== undefined) {
            let buf = Buffer.alloc(2);
            buf.writeUInt16BE(obj[info]);
            header.push(buf);
        } else {
            break;
        };
    };
    header = Buffer.concat(header);
    headerSize.writeUInt32BE(header.length);
    let tracks = writeTracks(obj.tracks);
    return Buffer.concat([magic, headerSize, header, tracks]);
};

module.exports = {
    parseVLQ,
    parseTrack,
    parseTracks,
    parseSMF,
    writeVLQ,
    writeTrack,
    writeTracks,
    writeSMF,
};
