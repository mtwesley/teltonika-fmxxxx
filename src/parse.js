'use strict';

const IMEIs = require('./IMEIs');
const Sockets = require('./sockets');
const Database = require('./db');

function getValue(content, offset, length) {
    return parseInt(content.slice(offset, length).toString('hex'), 16);
}

function getGPSValue(content, offset, length) {
    const precision = 10000000;
    const value = parseInt(content.slice(offset, length).toString('hex'), 16);
    return (value / precision) * ((value.toString(2))[0] == '0' ? 1 : -1);
}

function parseContent(content) {
    const avlRecords = [];
    const codecId = content.readUInt8(0);
    const recordsCount = content.readUInt8(1);
    content = content.slice(2);
    for (let idx = 0; idx < recordsCount; idx++) {
        const timeStamp = new Date(getValue(content, 0, 8));
        content = content.slice(8);
        const priority = getValue(content, 0, 1);
        content = content.slice(1);
        const longitude = getGPSValue(content, 0, 4);
        content = content.slice(4);
        const latitude = getGPSValue(content, 0, 4);
        content = content.slice(4);
        const altitude = getValue(content, 0, 2);
        content = content.slice(2);
        const angle = getValue(content, 0, 2);
        content = content.slice(2);
        const satellites = getValue(content, 0, 1);
        content = content.slice(1);
        const speed = getValue(content, 0, 2);
        content = content.slice(2);
        const ioElementId = getValue(content, 0, 1);
        content = content.slice(1);
        const ioElementsCount = getValue(content, 0, 1);
        content = content.slice(1);
        const ioOneByteCount = getValue(content, 0, 1);
        content = content.slice(1);

        const ioOneByteRecords = {};
        const ioTwoByteRecords = {};
        const ioFourByteRecords = {};
        const ioEightByteRecords = {};

        for (let ioIdx = 0; ioIdx < ioOneByteCount; ioIdx++) {
            const ioId = getValue(content, 0, 1);
            content = content.slice(1);
            const ioValue = getValue(content, 0, 1);
            content = content.slice(1);
            ioOneByteRecords[ioId] = ioValue;
        }

        const ioTwoByteCount = getValue(content, 0, 1);
        content = content.slice(1);

        for (let ioIdx = 0; ioIdx < ioTwoByteCount; ioIdx++) {
            const ioId = getValue(content, 0, 1);
            content = content.slice(1);
            const ioValue = getValue(content, 0, 2);
            content = content.slice(2);
            ioTwoByteRecords[ioId] = ioValue;
        }

        const ioFourByteCount = getValue(content, 0, 1);
        content = content.slice(1);

        for (let ioIdx = 0; ioIdx < ioFourByteCount; ioIdx++) {
            const ioId = getValue(content, 0, 1);
            content = content.slice(1);
            const ioValue = getValue(content, 0, 4);
            content = content.slice(4);
            ioFourByteRecords[ioId] = ioValue;
        }

        const ioEightByteCount = getValue(content, 0, 1);
        content = content.slice(1);

        for (let ioIdx = 0; ioIdx < ioEightByteCount; ioIdx++) {
            const ioId = getValue(content, 0, 1);
            content = content.slice(1);
            const ioValue = getValue(content, 0, 8);
            content = content.slice(8);
            ioEightByteRecords[ioId] = ioValue;
        }

        avlRecords.push({
            codecId,
            timeStamp,
            priority,
            longitude,
            latitude,
            altitude,
            angle,
            satellites,
            speed,
            ioElementId,
            ioOneByteRecords,
            ioTwoByteRecords,
            ioFourByteRecords,
            ioEightByteRecords
        });
    }

    console.log(content);

    return avlRecords;
};

module.exports = function parse() {
    let records;
    const socket = Sockets.get(this);

    if (socket) {
        if (!socket.waitForContent) {
            let contentLength = this.read(8);
            contentLength = contentLength.slice(4).readUInt32BE();

            const content = this.read(contentLength);

            if (!content) {
                socket.waitForContent = true;
                socket.contentLength = contentLength;
                return;
            }

            records = parseContent(content);
        }

        if (socket.contentLength < 1) {
            throw new Error(`Invalid content length: ${socket.contentLength}`);
        }

        const content = this.read(socket.contentLength);

        if (!content) {
            return;
        }

        records = parseContent(content);
        records.forEach(value => console.log(value));
    } else {
        const imei = this.read(17).toString().slice(2);
        const text = "SELECT COUNT(id) FROM assets WHERE properties->>'imei' = $1";
        const values = [imei];

        // Database.connect();
        // Database.query(text, values, (err, res) => {
        //     if (!err && res.rowCount > 0 && res.rows[0].count > 0) {
        //         Sockets.set(this, {imei, self: this, waitForContent: false});
        //         this.write(Buffer.from('01', 'hex'));
        //     }
        //     Database.end();
        // });

        // if (!IMEIs.has(imei)) {
        //     throw new Error('Unknown device');
        // }
    }
};

// '00000113fc208dff000f14f650209cca80006f00d60400040004030101150316030001460000015d0000000113fc17610b000f14ffe0209cc580006e00c00500010004030101150316010001460000015e0000000113fc284945000f150f00209cd200009501080400000004030101150016030001460000015d0000000113fc267c5b000f150a50209cccc0009300680400000004030101150016030001460000015b00'
// '080400000113fc208dff000f14f650209cca80006f00d60400040004030101150316030001460000015d0000000113fc17610b000f14ffe0209cc580006e00c00500010004030101150316010001460000015e0000000113fc284945000f150f00209cd200009501080400000004030101150016030001460000015d0000000113fc267c5b000f150a50209cccc0009300680400000004030101150016030001460000015b0004'
// '00000113fc284945000f150f00209cd200009501080400000004030101150016030001460000015d00'

// '0f14f650209cca80006f00d6040004'