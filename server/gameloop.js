var Loop = require('./../node_modules/mainloop.js/src/mainloop.js');

var _data = null;

function turn(_data)
{

}

function update(delta)
{

}

Loop.setMaxAllowedFPS(30);

Loop.setUpdate(update);

process.on('message', function (msg)
{
    if (msg.type && msg.type === 'turn')
    {
        turn(msg.data);
    }
    else
    {
        _data = msg;

        Loop.start();

        console.log(_data);
    }
});
