const net = require('net');
const parser = require('./parse');
const config = require('config');
const request = require('request');

// const { Pool, Client } = require('pg')

const serverConfig = config.get('server');
const databaseConfig = config.get('database');
const messageConfig = config.get('message');

const HOST = serverConfig.host;
const PORT = serverConfig.port;

const sockets = new Map();

// const pool = new Pool({
//   host: databaseConfig.host,
//   port: databaseConfig.port,
//   user: databaseConfig.user,
//   password: databaseConfig.password,
//   database: databaseConfig.database,
// });

const server = net.createServer((connection) => {
    console.log(`${connection.remoteAddress}: Connection established`);

    if (!sockets.has(connection)) sockets.set(connection, {imei: 0});
    const socket = sockets.get(connection);

    connection.on('error', e => {
        console.log(`${connection.remoteAddress}: Error (${e})`);
        connection.close();
    });

    connection.on('close', hasError => {
        console.log(`${connection.remoteAddress}: Connection closed`);
        sockets.delete(connection);
    });

    connection.on('data', (data) => {
        console.log(`${connection.remoteAddress}: Data received`);

        if (data.length == 17) {
            let response = Buffer.from('01', 'hex');
            let imei = data.toString().slice(2);
            socket.imei = parseInt(imei);
            connection.write(response);
        } else {
            let payload = data.slice(0, 8);
            let contentlength = payload.slice(4,8);
            let content = data.slice(8, contentlength.readUInt32BE());
            let information = parser(content);
            information.forEach((info) => 
                request.post({
                    headers: {'User-Agent': 'X-Cookshop-Teltonika'},
                    uri: messageConfig.url, 
                    json: {imei: socket.imei, data: information}}));
            console.log(`${connection.remoteAddress}: IMEI ${socket.imei}`);
            console.log(`${connection.remoteAddress}: Information`, information);
            connection.write(Buffer.from("00000002", 'hex'));
        }
    });
});

server.listen(PORT, HOST, () => console.log(`Server listening on (${HOST}:${PORT})`));