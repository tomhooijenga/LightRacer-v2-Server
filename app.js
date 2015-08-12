var settings = require('./settings.json');
var cluster = require('cluster');
var Server = require('socket.io');
var Lobby = require('./server/lobby.js');
var Player = require('./server/player.js');

var io = new Server(settings.port);
var players = [];
var playerId = -1;
var lobbyId = -1;
var lobbies = [];

// Will be openend in child thread
cluster.settings.exec = './server/gameloop.js';

io.on('connection', function (socket) {

    var player = new Player(++playerId, socket);

    players.push(player);

    socket.on('list', function () {
        socket.emit('list', lobbies.map(function (lobby) {
            var length = lobby.players.length;

            if (length > 0 && length < settings.maxplayers)
            {
                return {
                    players: length,
                    id: lobby.id
                }
            }
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

    socket.on('ready', function () {

        var lobby = lobbies[player.lobbyId],
            ready = ++lobby.ready;

        if (ready === settings.maxplayers)
        {
            // Create a game thread
            cluster.fork().send({
                lobby: lobby
            });
        }
    });

    socket.on('turn', function (data) {
        //lobbies[player.lobbyId].worker.send('turn', data);
    });

    socket.on('disconnect', function () {
        delete players[player.id];

        leave();
    });

    function leave()
    {
        var lobby = lobbies[player.lobbyId];

        if (lobby)
        {
            var players = lobby.players;

            // Put color back in the mix
            lobby.colors.push(player.spawn.color);

            // Remove player from game
            players.splice(players.indexOf(player.id), 1);
        }
    }
});

// Clean up the lobbies each second
setInterval(function () {
    for (var i = 0; i < lobbies.length; i++) {
        var lobby = lobbies[i];

        if (!lobby)
        {
            continue;
        }

        for (var j = 0; j < lobby.players.length; j++) {
            var id = lobby.players[j];

            if (!players[id])
            {
                lobby.players.splice(i, 1);
            }
        }

        if (lobby.players.length === 0)
        {
            delete lobbies[i];
        }
    }
}, 1000);