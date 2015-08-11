var settings = require('./../settings.json');

var Lobby = function (id) {

    this.id = id;

    /**
     * @type {Array}
     */
    this.players = [];

    /**
     * 2d array of 1000x1000
     * @type {Array}
     */
    this.map = new Array(settings.game.size.x);

    for (var i = 0; i < settings.game.size.x; i++) {
        this.map[i] = new Array(settings.game.size.y);
    }

    // Blue, Green, Yellow, Red
    this.colors = ['#4A89DC', '#A0D468', '#F6BB42', '#DA4453'];
};

Lobby.prototype.spawn = function (playerId) {
    var x = Math.floor(200 + Math.random() * (settings.game.size.x - 400)),
        y = Math.floor(200 + Math.random() * (settings.game.size.y - 400)),
        direction = settings.game.directions[Math.floor(Math.random() * 4)],
        color = this.colors.splice(Math.floor(Math.random() * this.colors.length), 1)[0];

    // Create the spawn position with a 200px distance of the map edge

    // Emit the spawn action to the client.
    return {
        x: x,
        y: y,
        playerId: playerId,
        color: color,
        dir: direction
    };
};

module.exports = Lobby;