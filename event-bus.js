const EventEmitter = require('events');

function createEventBus(_source) {
  const emitter = new EventEmitter();

  const dispatch = (action, data) => {
    const source = action.source || _source;
    const eventData =
      typeof action === 'object'
        ? { ...action, source }
        : {
            type: action,
            payload: data,
            source,
          };

    emitter.emit('action', eventData);
  };

  return { emitter, dispatch };
}

module.exports = { createEventBus };
