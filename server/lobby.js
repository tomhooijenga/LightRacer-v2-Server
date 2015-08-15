var settings = require('./../settings.json');

/**
 *
 * @param {number} id
 * @constructor
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
     * Purple, indigo, teal, orange
     * @type {string[]}
     */
    this.colors = ['#9C27B0', '#3F51B5', '#009688', '#FF9800'];
};

/**
 * Calculate a spawn position for a player
 *
 * @param {number} playerId - the id of the player
 * @returns {{position: *[], playerId: *, color: string, direction: *}}
 */
Lobby.prototype.spawn = function (playerId) {
    var x = Math.floor(200 + Math.random() * (settings.game.size.x - 400)),
        y = Math.floor(200 + Math.random() * (settings.game.size.y - 400)),
        direction = settings.game.directions[Math.floor(Math.random() * 4)],
        color = this.colors.splice(Math.floor(Math.random() * this.colors.length), 1)[0];

    // Create the spawn position with a 200px distance of the map edge

    // Emit the spawn action to the client.
    return {
        position: [x, y],
        playerId: playerId,
        color: color,
        direction: direction
    };
};

module.exports = Lobby;