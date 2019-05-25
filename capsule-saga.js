const { runSaga, stdChannel, END } = require('redux-saga');
const { delay, call, cancelled, take, race, fork, put } = require('redux-saga/effects');
const actions = require('./actions');

const matchSensor = number => {
  return action => action.type === actions.SENSOR_TRIGGER && action.payload.sensorNumber === number;
};

function* activateZone(zoneNumber) {
  for (let retries = 0; retries <= 1; retries++) {
    const [sensorTriggered, timeout] = yield race([take(matchSensor(zoneNumber)), delay(5000)]);

    if (sensorTriggered) {
      return true;
    }

    if (timeout) {
      yield put({ type: actions.ZONE_ACTIVATION_WARNING, payload: { zoneNumber } });
    }
  }

  yield put(END);

  return false;
}

function* zone1Task() {
  yield take(matchSensor(1));
  yield put({ type: actions.ZONE_ACTIVATED, payload: { zoneNumber: 1 } });
  yield take(actions.TV_STAND_MOVE_FINISHED);
  yield put({ type: actions.VIDEO_START });
  yield take(actions.VIDEO_FINISHED);
  yield put({ type: actions.ZONE_FINISHED, payload: { zoneNumber: 1 } });
}

function* zone2Task() {
  const activated = yield call(activateZone, 2);

  if (!activated) {
    return;
  }

  yield put({ type: actions.ZONE_ACTIVATED, payload: { zoneNumber: 2 } });
  yield take(actions.TV_STAND_MOVE_FINISHED);
  yield put({ type: actions.VIDEO_START });
  yield take(actions.VIDEO_FINISHED);
  yield put({ type: actions.ZONE_FINISHED, payload: { zoneNumber: 2 } });
}

function* zone3Task() {
  const activated = yield call(activateZone, 3);

  if (!activated) {
    return;
  }

  yield put({ type: actions.ZONE_ACTIVATED, payload: { zoneNumber: 3 } });
  yield take(actions.TV_STAND_MOVE_FINISHED);
  yield put({ type: actions.VIDEO_START });
  yield take(actions.VIDEO_FINISHED);
  yield put({ type: actions.ZONE_FINISHED, payload: { zoneNumber: 3 } });
}

function* simulatorSaga() {
  try {
    while (true) {
      yield put({ type: actions.INIT });
      yield fork(zone1Task);
      yield take(actions.ZONE_FINISHED);

      yield fork(zone2Task);
      yield take(actions.ZONE_FINISHED);

      yield fork(zone3Task);
      yield take(actions.ZONE_FINISHED);

      yield put({ type: actions.FINISH });
    }
  } finally {
    if (yield cancelled()) {
    }
  }
}

function createSagaIO(emitter, dispatch, state) {
  const channel = stdChannel();
  emitter.on('action', channel.put);

  return {
    channel,
    dispatch,
    getState: () => state,
  };
}

const state = {};

function stopCapsuleSaga(dispatch) {
  console.log('Stopping Capsule saga...');
  dispatch(END);
}

function startCapsuleSaga(emitter, dispatch) {
  stopCapsuleSaga(dispatch);

  console.log('Starting Capsule saga...');

  const sagaIO = createSagaIO(emitter, dispatch, state);

  runSaga(sagaIO, simulatorSaga);
}

module.exports = { startCapsuleSaga, stopCapsuleSaga };
