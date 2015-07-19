var settings = require('./settings.json');
var Server = require('socket.io');
var Client = require('./server/client.js');

var clientId = 0;
var io = new Server(settings.port);

io.on('connection', listen);

function listen(socket) {
    var client = new Client(socket, ++clientId);
    client.on('disconnect', function () {
        console.log('client disconnected');
    });
    client.spawnPlayer();
}