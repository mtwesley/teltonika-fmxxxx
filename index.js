const net = require('net');
const parser = require('./parse');

const args = require('minimist')(process.argv.slice(2));

const HOST = args['h'] || '0.0.0.0';
const PORT = args['p'] || 12141;

const server = net.createServer((connection) => {
    console.log(`${connection.remoteAddress}: Connection established.`);

    connection.on('error', e => {
        console.log(`${connection.remoteAddress}: Error (${e})`);
        connection.close();
    });

    connection.on('data', (data) => {

        console.log(`${connection.remoteAddress}: Data received\n${data}\n`);
        
        // console.log(connection.remoteAddress)
        // console.log(data);
        
        if (data.length == 17) {
            let response = Buffer.from('01', 'hex');
            let imei = data.toString().slice(2);
            
            console.log(`${connection.remoteAddress}: IMEI (${imei}`);

            connection.write(response);
        } 
        else {
            let payload = data.slice(0, 8);
            let contentlength = payload.slice(4,8);
            
            // console.log("payload " + contentlength.readUInt32BE() + "----------------");
            // console.log(payload);

            let content = data.slice(8, contentlength.readUInt32BE());
            
            // console.log("content----------------------");
            // console.log(content);
            
            let information = parser(content);
            
            // console.log("--------------------------------")
            console.log(information);

            // let latitude = Buffer.allocUnsafe(4);
            // let longitude = Buffer.allocUnsafe(4);
        
            // latitude.writeUInt32BE(information.pop().latitude);
            // longitude.writeUInt32BE(information.pop().longitude);

            // latitude = latitude.readInt32BE() / Math.pow(10,7);
            // longitude = longitude.readInt32BE() / Math.pow(10,7);
            
            // console.log(`latitude: ${latitude} | longitude: ${longitude}`);

            connection.write(Buffer.from("00000002", 'hex'));
        }
    });
});

server.listen(PORT, HOST, () => console.log("Server listening."));