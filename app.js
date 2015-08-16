var settings = require('./settings.json');
var cluster = require('cluster');
var Server = require('socket.io');
var Lobby = require('./server/lobby.js');
var Player = require('./server/player.js');

var io = new Server(process.env.PORT || 8001);
var players = [];
var playerId = -1;
var lobbyId = -1;
var lobbies = [];

// Will be openend in child thread
cluster.settings.exec = './server/gameloop.js';

io.on('connection', function (socket) {

    var player = new Player(++playerId, socket);

    players.push(player);

    console.log('player connected: %d', player.id);

    socket.on('list', list);

    function list() {

        console.log('listing games');

        emitAll(players.map(function (_player) {
            return _player.id;
        }), 'list', lobbies.map(function (lobby) {
            var length = lobby.players.length;

            // Not empty, not full, and not running
            if (length > 0 && length < settings.maxplayers && lobby.worker === null) {
                return {
                    players: length,
                    id: lobby.id
                };
            }
        }));
    }

    socket.on('create', function () {

        console.log('creating game');

        var lobby = new Lobby(++lobbyId);

        lobbies[lobbyId] = lobby;

        // Disconnect other game
        leave();

        socket.emit('create', true);

        join(lobby);

        list();
    });

    socket.on('join', function (_lobbyId) {

        leave();

        join(lobbies[_lobbyId]);

        list();
    });


    function join (lobby)
    {
        console.log('player %d joined game %d', player.id, lobby.id);

        // Add player to lobby
        lobby.players.push(player.id);

        // Add lobby to player
        player.lobbyId = lobby.id;

        socket.emit('join', true, player.id);

        spawn();
    }

    socket.on('spawn', spawn);

    function spawn() {
        var lobby = lobbies[player.lobbyId];

        player.spawn = lobby.spawn(player.id);

        lobby.players.forEach(function (id) {
            emitAll(lobby.players, 'spawn', players[id].spawn);
        });

        colors(lobby);
    }

    socket.on('color', function (color) {
        var lobby = lobbies[player.lobbyId],
            _colors = lobby.colors;

        // New color is no longer available
        _colors.splice(_colors.indexOf(color), 1);

        // Old color is back in the game
        _colors.push(player.spawn.color);

        player.spawn.color = color;

        colors(lobby);
    });

    function colors(lobby) {
        var taken = {};
        lobby.players.map(function (id)
        {
            taken[id] = players[id].spawn.color;
        });

        emitAll(lobby.players, 'color', lobby.colors, taken);
    }

    socket.on('ready', function (status) {

        var lobby = lobbies[player.lobbyId];

        if (status) {
            lobby.ready++;
        }
        else {
            lobby.ready--;
        }

        if (lobby.ready === settings.maxplayers) {

            console.log('starting game');

            // Create a game thread
            var worker = cluster.fork();

            worker.send({
                lobby: lobby,
                // Just passing players throws circular reference error
                // Probably because the socket
                players: lobby.players.map(function (id) {
                    var pl = players[id];

                    return {
                        id: pl.id,
                        direction: pl.spawn.direction,
                        position: pl.spawn.position,
                        crashed: false
                    };
                })
            });

            lobby.worker = worker;

            emitAll(lobby.players, 'start');

            worker.on('message', function (data) {
                if (data.type === 'move') {
                    emitAll(lobby.players, 'move', data.players);
                }
                else if (data.type === 'endgame') {
                    emitAll(lobby.players, 'endgame', data.winner);
                }
            });
        }
    });

    socket.on('turn', function (direction) {
        lobbies[player.lobbyId].worker.send({
            type: 'turn',
            direction: direction,
            playerId: player.id
        });
    });

    socket.on('disconnect', function () {
        delete players[player.id];

        leave();
    });


    socket.on('leave', leave);

    function leave() {
        var lobby = lobbies[player.lobbyId];

        if (lobby) {
            var _players = lobby.players;

            // Put color back in the mix
            lobby.colors.push(player.spawn.color);

            // Remove player from game
            _players.splice(_players.indexOf(player.id), 1);

            if (lobby.worker) {
                lobby.worker.send({
                    type: 'leave',
                    data: player.id
                });
            }
        }

        list();
    }

    /**
     * Emit an event to a list of players
     * @param {Array} playerIds
     * @param {string} type
     * @param [data1]
     * @param [data2]
     */
    function emitAll(playerIds, type, data1, data2) {
        playerIds.forEach(function (pl) {
            players[pl].socket.emit(type, data1, data2);
        });
    }
});

// Clean up the lobbies each second
setInterval(function () {
    for (var i = 0; i < lobbies.length; i++) {
        var lobby = lobbies[i];

        if (!lobby) {
            continue;
        }

        for (var j = 0; j < lobby.players.length; j++) {
            var id = lobby.players[j];

            if (!players[id]) {
                lobby.players.splice(i, 1);
            }
        }

        if (lobby.players.length === 0) {
            delete lobbies[i];
        }
    }
}, 1000);