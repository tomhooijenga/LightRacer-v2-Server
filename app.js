var settings = require('./settings.json');
var Server = require('socket.io');
var Client = require('./server/client.js');
var Lobby = require('./server/lobby.js');

var clientId = 0;
var lobbyId = 0;
var io = new Server(settings.port);
var lobbies = [];

io.on('connection', function (socket) {
    var client = new Client(socket, socket.id);

    socket.on('list', function () {
        socket.emit('list', lobbies.filter(function (lobby) {
            return lobby.players < settings.maxplayers;
        }));
    });

    socket.on('create', function () {
        var lobby = new Lobby(++lobbyId);

        // We joined
        lobby.players = 1;
        client.lobby = lobby.id;

        lobbies[lobbyId] = lobby;

        socket.emit('create', lobby);
    });

    socket.on('disconnect', function () {
        console.log('client disconnected');
    })
});

/*
function listen(socket) {
    var client = new Client(socket, ++clientId);

    client.on('disconnect', function () {
        console.log('client disconnected');
    });

    // TODO: Join lobby first
    //client.spawnPlayer();
}*/
