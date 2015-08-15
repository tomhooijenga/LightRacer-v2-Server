var Loop = require('./../node_modules/mainloop.js/src/mainloop.js');
var settings = require('./../settings.json').game;

var players,
    lobby,
    map;

/**
 * 2d array of 1000x1000
 * @type {Array}
 */
map = new Array(settings.size.x);

for (var i = 0; i < settings.size.x; i++) {
    map[i] = new Array(settings.size.y);
}

var actions = {
    turn: function (data) {
        for (var i = 0; i < players.length; i++) {
            if (players[i].id === data.playerId) {
                players[i].direction = data.direction;

                break;
            }
        }
    },
    leave: function (data) {
        for (var i = 0; i < players.length; i++) {
            if (players[i].id === data.playerId) {
                players[i].crashed = true;

                break;
            }
        }
    }
};


function endgame() {
    var winner = {};

    for (var i = 0; i < players.length; i++) {
        if (!players[i].crashed) {
            winner = players[i].id;

            break;
        }
    }

    process.send({
        type: 'endgame',
        winner: winner
    });
}

Loop.setMaxAllowedFPS(30)
    .setUpdate(function (delta) {
        var alive = 0;

        // Move each player and check if there's any alive
        players.forEach(function (player) {
            if (player.crashed) {
                return;
            }

            var heading = player.direction,
                dir = 0, // horizontal
                modifier = 1, // down or right
                oldX = Math.round(player.position[0]),
                oldY = Math.round(player.position[1]);

            // Up or down -> y axis
            if (heading === 8 || heading === 16) {
                dir = 1;
            }

            // Left or up -> negative movement
            if (heading === 2 || heading === 8) {
                modifier = -1;
            }

            var movement = (settings.speed * modifier * delta) / 1000;

            player.position[dir] += movement;

            // Round it because we have sub-pixel movement
            var x = Math.round(player.position[0]),
                y = Math.round(player.position[1]);

            // Out of bounds
            if (x < 0 || x > settings.size.x - 1 || y < 0 || y > settings.size.y - 1) {
                player.crashed = true;
            }
            else {
                // Position was taken
                if (map[x][y] !== undefined) {
                    player.crashed = true;
                }

                // Determine start and end points
                var a = dir ? y : x,
                    b = dir ? oldY : oldX;

                // Fill every spot between the old and new position
                for (var i = Math.min(a, b); i <= Math.max(a, b); i++) {
                    if (dir) {
                        map[x][i] = player.id;
                    }
                    else {
                        map[i][y] = player.id;
                    }
                }
            }

            if (!player.crashed) alive++;
        });

        if (alive <= 1) {
            // Calling stop() inside the loop won't stop it; The next frame will be requested after this callback.
            // Therefore, call it async
            process.nextTick(function () {
                Loop.stop();

                endgame();
            });
        }
    })
    .setDraw(function () {
        process.send({
            type: 'move',
            players: players,
            lobbyId: lobby.id
        });
    });

process.on('message', function (data) {
    if (data.type) {
        actions[data.type](data);
    }
    else {
        players = data.players;
        lobby = data.lobby;

        Loop.start();
    }
});


