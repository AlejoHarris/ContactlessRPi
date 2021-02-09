const threesixty = 28300;
const fs = require('fs');
var express = require('express');
var app = express();
var server = app.listen(process.env.PORT || 3000, listen);
var clients = [];
var tempAngles = [0, 0, 0];
var sw = [false, false, false];
var changing = [false, false, false];
var confirmation = 0;

function listen() {
    let host = server.address().address;
    let port = server.address().port;
    console.log('Listening at http://' + host + ':' + port);
}

function mapOld(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

app.use(express.static('public'));
var io = require('socket.io')(server);
io.sockets.on('connection', (socket) => {
    let clientIp = socket.request.connection.remoteAddress;
    clients.push({ client: socket.id, ip: clientIp });
    console.log('Connected users: ');
    clients.forEach((element) => {
        console.log(element.ip, element.client);
    })
    console.log('Client ' + clientIp + ' connected');
    let clientIndex = clients.findIndex(clients => clients.client == socket.id);
    io.to(socket.id).emit('turn', clientIndex);

    socket.on('data', (data) => {
        //console.log(data)
        socket.broadcast.emit('serverData', data);
        let temp = [0, 0, 0];
        temp[0] = parseFloat(mapOld((data.c).toFixed(2), 0, 2 * Math.PI, 0, threesixty).toFixed(0));
        temp[1] = parseFloat(mapOld((data.m).toFixed(2), 0, 2 * Math.PI, 0, threesixty).toFixed(0));
        temp[2] = parseFloat(mapOld((data.y).toFixed(2), 0, 2 * Math.PI, 0, threesixty).toFixed(0));
        let inputData = {
            c: temp[0],
            m: temp[1],
            y: temp[2]
        };
        for (let i = 0; i < 3; i++) {
            if (tempAngles[i] != temp[i]) {
                changing[i] = true;
                sw[i] = true;
                confirmation = 0;
            } else {
                changing[i] = false;
                confirmation++;
            }
            if (!changing[i] && sw[i] && confirmation >= 5) {
                let jsonData = JSON.stringify(inputData);
                fs.writeFileSync('./public/cmy.json', jsonData);
                sw[i] = false;
                console.log('saved')
                confirmation = 0;
            }
            tempAngles[i] = temp[i];
        }

    });
    socket.on('disconnect', () => {
        let clientIndex = clients.findIndex(clients => clients.client == socket.id);
        clients.splice(clientIndex, 1);
        clients.forEach((element, index) => {
            io.to(element.client).emit('turn', index);
        })
        console.log('Connected users: ' + clients);
        console.log('Client ' + clientIp + ' disconnected');

    })

});
