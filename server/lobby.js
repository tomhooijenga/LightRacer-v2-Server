var settings = require('./../settings.json');

/**
 *
 * @param {number} id
 * @constructor
 */

/**
 * Calculate a spawn position for a player
 *
 * @param {number} playerId - the id of the player
 * @returns {{position: *[], playerId: *, color: string, direction: *}}
 */
var Lobby = function (id) {

    /**
     * @type {number} id - The id of the lobby
     */
    this.id = id;

    /**
     * @type {number} ready - Number of players that are ready
     */
    this.ready = 0;

    /**
     * @type {Array} players - The players that are in this lobby
     */
    this.players = [];

    /**
     * Thread that runs the game loop
     */
    this.worker = null;

    /**
     * The available colors
     * @type {string[]}
     */
    this.colors = ['purple', 'indigo', 'teal', 'orange'];
};
Lobby.prototype.spawn = function (playerId) {
    var x = Math.floor(200 + Math.random() * (settings.game.size.x - 400)),
        y = Math.floor(200 + Math.random() * (settings.game.size.y - 400)),
        direction = settings.game.directions[Math.floor(Math.random() * 4)],
        color = Math.floor(Math.random() * this.colors.length);

    var ret = {
        position: [x, y],
        playerId: playerId,
        color: this.colors[color],
        direction: direction
    };

    // This color is no longer available
    this.colors.splice(color, 1);

    return ret;
};

module.exports = Lobby;