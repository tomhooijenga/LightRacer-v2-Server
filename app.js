var settings = require('./settings.json');
var Server = require('socket.io');
var Lobby = require('./server/lobby.js');
var Player = require('./server/player.js');

var io = new Server(settings.port);
var players = [];
var playerId = -1;
var lobbyId = -1;
var lobbies = [];

io.on('connection', function (socket) {

    var player = new Player(++playerId, socket);
    players.push(player);

    socket.on('list', function () {
        socket.emit('list', lobbies.filter(function (lobby)
        {
            var length = lobby.players.length;

            return length > 0 && length < settings.maxplayers;
        }));
    });

    socket.on('create', function () {
        var lobby = new Lobby(++lobbyId);

        lobbies[lobbyId] = lobby;

        // Disconnect other game
        leave();

        lobby.players.push(player.id);
        player.lobbyId = lobby.id;

        socket.emit('create', true);
    });

    socket.on('join', function (_lobbyId) {
        leave();

        if (lobbies[_lobbyId])
        {
            lobbies[_lobbyId].players.push(player.id);
            player.lobbyId = _lobbyId;

            socket.emit('join', true);
        }
    });

    socket.on('spawn', function () {
        // Todo: note on map
        player.spawn = lobbies[player.lobbyId].spawn(playerId);

        // Send all spawns to all players in lobby
        var lobbyPlayers = lobbies[player.lobbyId].players;

        lobbyPlayers.forEach(function (id)
        {
            var socket = players[id].socket;

            lobbyPlayers.forEach(function (_id)
            {
                socket.emit('spawn', players[_id].spawn);
            });
        });
    });

    socket.on('move', function () {

    });

    socket.on('disconnect', function () {
        delete players[player.id];

        leave();
    });

    function leave()
    {
        if (lobbies[player.lobbyId])
        {
            var players = lobbies[player.lobbyId].players;

            players.splice(players.indexOf(player.id), 1);
        }
    }
});

// Clean up the lobbies each second
setInterval(function () {
    lobbies = lobbies.filter(function (lobby) {

        for (var i = 0; i < lobby.players.length; i++) {
            var id = lobby.players[i];

            if (!players[id])
            {
                lobby.players.splice(i, 1);
            }
        }

        return lobby.players.length > 0;
    });
}, 1000);