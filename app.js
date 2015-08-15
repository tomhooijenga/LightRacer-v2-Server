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
        socket.emit('list', list());
    });

    socket.on('create', function () {
        var lobby = new Lobby(++lobbyId);

        lobbies[lobbyId] = lobby;

        // Disconnect other game
        leave();

        lobby.players.push(player.id);
        player.lobbyId = lobby.id;

        socket.emit('create', true);

        emitAll(players.map(function (_player) {
            return _player.id;
        }), 'list', list());
    });

    socket.on('join', function (_lobbyId) {
        leave();

        if (lobbies[_lobbyId]) {
            lobbies[_lobbyId].players.push(player.id);
            player.lobbyId = _lobbyId;

            socket.emit('join', true);

            emitAll(players.map(function (_player) {
                return _player.id;
            }), 'list', list());
        }
    });

    socket.on('spawn', function () {
        var lobby = lobbies[player.lobbyId];

        player.spawn = lobby.spawn(player.id);

        lobby.players.forEach(function (id) {
            emitAll(lobby.players, 'spawn', players[id].spawn);
        });
    });

    socket.on('ready', function () {

        var lobby = lobbies[player.lobbyId],
            ready = ++lobby.ready;

        this.emit('ready', player.id);

        if (ready === settings.maxplayers) {
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

    /**
     * Leave a lobby
     */
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

        emitAll(players.map(function (_player) {
            return _player.id;
        }), 'list', list());
    }

    /**
     * Emit an event to a list of players
     * @param {Array} playersIds
     * @param {string} type
     * @param [data]
     */
    function emitAll(playersIds, type, data) {
        playersIds.forEach(function (pl) {
            players[pl].socket.emit(type, data);
        });
    }

    /**
     * Filter the lobbies list
     * @returns {Array}
     */
    function list() {
        return lobbies.map(function (lobby) {
            var length = lobby.players.length;

            // Not empty, not full, and not running
            if (length > 0 && length < settings.maxplayers && lobby.worker === null) {
                return {
                    players: length,
                    id: lobby.id
                };
            }
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