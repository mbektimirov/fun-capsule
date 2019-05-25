const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const actions = require('./actions');
const { createEventBus } = require('./event-bus');
const { startCapsuleSaga, stopCapsuleSaga } = require('./capsule-saga');

const { emitter, dispatch } = createEventBus('server');
const port = 5000;

console.log('Express/Socket.Io listening on port', port);

server.listen(port);
// WARNING: app.listen(port) will NOT work here!

// app.get('/', function(req, res) {
//   res.sendFile(__dirname + '/index.html');
// });

io.on('connection', socket => {
  console.log('Socket: client connected');

  emitter.on('action', action => {
    // don't send back client actions
    if (action.source !== 'client') {
      socket.emit('action', action);
    }
  });

  socket.on('action', action => {
    console.log('SOCKET action', action);

    switch (action.type) {
      case actions.START:
        startCapsuleSaga(emitter, dispatch);
        break;

      case actions.STOP:
        stopCapsuleSaga(dispatch);
        break;

      default:
        dispatch(action);
        break;
    }
  });
});
