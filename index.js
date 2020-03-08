const net = require('net');
const parser = require('./parse');

const args = require('minimist')(process.argv.slice(2));

const HOST = args['h'] || '0.0.0.0';
const PORT = args['p'] || 12141;

const sockets = new Map();

const server = net.createServer((connection) => {
    console.log(`${connection.remoteAddress}: Connection established.`);

    if (!sockets.has(connection)) sockets.set(connection, {imei: 0, infromation: {}});
    const socket = sockets.get(connection);

    connection.on('error', e => {
        console.log(`${connection.remoteAddress}: Error (${e})`);
        connection.close();
    });

    connection.on('data', (data) => {
        console.log(`${connection.remoteAddress}: Data received.`);

        if (data.length == 17) {
            let response = Buffer.from('01', 'hex');
            let imei = data.toString().slice(2);
            socket.imei = imei;
            connection.write(response);
        } 
        else {
            let payload = data.slice(0, 8);
            let contentlength = payload.slice(4,8);
            let content = data.slice(8, contentlength.readUInt32BE());
            let information = parser(content);
            socket.information = information;
            console.log(`${connection.remoteAddress}: IMEI (${socket.imei})`);
            console.log(`${connection.remoteAddress}: Information (${socket.information})`);
            connection.write(Buffer.from("00000002", 'hex'));
        }
    });
});

server.listen(PORT, HOST, () => console.log(`Server listening on (${HOST}:${PORT}).`));