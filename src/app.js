import React from 'react';
import cx from 'classnames';
import { runSaga, stdChannel } from 'redux-saga';
import { delay, call, cancelled, take, race, fork, put } from 'redux-saga/effects';
import EventEmitter from 'events';

/*
- Датчик входа в Зону 1
- Датчик входа в Зону 2
- Датчик входа в Зону 3
- Датчик выхода из Зоны 3
- Видеостена
- Свет
- Мобильная стойка:
  - дисплей (телевизор),
  - камера с возможностью управления перемещением по горизонтали,
  - камера с возможностью управления перемещением по вертикали,
  - механизм, перемещающий мобильную стойку между тремя конечными положениями
 */

const actions = {
  INIT: 'INIT',
  SENSOR_TRIGGER: 'SENSOR_TRIGGER',
  ZONE_ACTIVATED: 'ZONE_ACTIVATED',
  // TV_STAND_MOVE_TO: 'TV_STAND_MOVE_TO',
  TV_STAND_MOVE_FINISHED: 'TV_STAND_MOVE_FINISHED',
  VIDEO_START: 'VIDEO_START',
  VIDEO_FINISHED: 'VIDEO_FINISHED',
  ZONE_FINISHED: 'ZONE_FINISHED',
  FINISH: 'FINISH',
};

const emitter = new EventEmitter();
const state = {};

const dispatch = event => emitter.emit('action', event);

const createSagaIO = (emitter, getStateResolve) => {
  const channel = stdChannel();
  emitter.on('action', channel.put);

  return {
    channel,
    dispatch,
    getState: () => state,
  };
};

const matchSensor = number => {
  return action => action.type === actions.SENSOR_TRIGGER && action.sensorNumber === number;
};

function* zone1Task() {
  yield take(matchSensor(1));
  yield put({ type: actions.ZONE_ACTIVATED, zoneNumber: 1 });
  yield take(actions.TV_STAND_MOVE_FINISHED);
  yield put({ type: actions.VIDEO_START });
  yield take(actions.VIDEO_FINISHED);
  yield put({ type: actions.ZONE_FINISHED, zoneNumber: 1 });
}

function* zone2Task() {
  yield take(matchSensor(2));
  yield put({ type: actions.ZONE_ACTIVATED, zoneNumber: 2 });
  yield take(actions.TV_STAND_MOVE_FINISHED);
  yield put({ type: actions.VIDEO_START });
  yield take(actions.VIDEO_FINISHED);
  yield put({ type: actions.ZONE_FINISHED, zoneNumber: 2 });
}

function* zone3Task() {
  yield take(matchSensor(3));
  yield put({ type: actions.ZONE_ACTIVATED, zoneNumber: 3 });
  yield take(actions.TV_STAND_MOVE_FINISHED);
  yield put({ type: actions.VIDEO_START });
  yield take(actions.VIDEO_FINISHED);
  yield put({ type: actions.ZONE_FINISHED, zoneNumber: 3 });
}

function* simulatorSaga() {
  try {
    while (true) {
      yield fork(zone1Task);
      yield take(actions.ZONE_FINISHED);

      yield fork(zone2Task);
      yield take(actions.ZONE_FINISHED);

      yield fork(zone3Task);
      yield take(actions.ZONE_FINISHED);

      // const [zone1Finished, zone1Interrupted] = yield race([
      //   take(actions.ZONE_FINISHED),
      //   take(actions.SENSOR_TRIGGER),
      // ]);
    }
  } finally {
    if (yield cancelled()) {
    }
  }
}

runSaga(createSagaIO(emitter, () => state), simulatorSaga);

const Zone = ({ number, label, active, isMeta, isFinished, onClick, onRender }) => {
  let zoneRef;

  const getZonePosition = () => ({
    number,
    isMeta,
    active,
    left: zoneRef.offsetLeft,
    top: zoneRef.offsetTop,
    width: zoneRef.offsetWidth,
  });

  const onRef = ref => {
    zoneRef = ref;
    zoneRef && onRender(getZonePosition());
  };

  const click = () => {
    onClick && onClick(getZonePosition());
  };

  const cls = cx('zone', {
    active,
    meta: isMeta,
    finished: isFinished,
  });

  return (
    <div className={cls} onClick={click} ref={onRef}>
      <div className="zone-number">{number}</div>
    </div>
  );
};

const User = ({ zone, active }) => {
  const left = zone ? zone.left + zone.width / 2 : 0;

  return <div className={cx('user', { active })} style={{ left }} />;
};

const TvStand = ({ zone, time, onMoveFinished }) => {
  const style = zone ? { left: zone.left + zone.width / 2 } : null;

  return (
    <div className="tv-rail">
      <div className="tv-stand" style={style} onTransitionEnd={onMoveFinished.bind(null, zone)}>
        <div className="video-timer">{time}</div>
      </div>
    </div>
  );
};

export default class App extends React.Component {
  state = { finishedZones: {} };
  zones = {};

  constructor() {
    super();

    let videoTickTimer;

    emitter.on('action', action => {
      switch (action.type) {
        case actions.ZONE_ACTIVATED:
          this.setState({
            userActiveZoneNumber: action.zoneNumber,
            tvStandActiveZoneNumber: action.zoneNumber,
          });

          if (this.state.tvStandActiveZoneNumber === action.zoneNumber) {
            dispatch({ type: actions.TV_STAND_MOVE_FINISHED });
          }

          break;
        case actions.VIDEO_START:
          this.setState({ videoPlaying: true });

          videoTickTimer = setInterval(() => {
            if (this.state.videoTimeTick >= 5) {
              dispatch({ type: actions.VIDEO_FINISHED });
              this.setState({ videoTimeTick: 0, videoPlaying: false });
              clearInterval(videoTickTimer);
              return;
            }

            this.setState({ videoTimeTick: (this.state.videoTimeTick || 0) + 1 });
          }, 1000);
          break;
        case actions.ZONE_FINISHED:
          this.setState({
            finishedZones: {
              ...this.state.finishedZones,
              [action.zoneNumber]: true,
            },
          });
          break;
      }
    });
  }

  onSensorTrigger(sensorNumber) {
    dispatch({ type: actions.SENSOR_TRIGGER, sensorNumber });
  }

  onTvStandMoveFinished(zone) {
    dispatch({ type: actions.TV_STAND_MOVE_FINISHED });
  }

  saveZone(zone) {
    this.zones[zone.number] = zone;
  }

  onZoneClick(zone) {
    // dispatch({ type: `ZONE_${zone.number}_TRIGGER`, zone });
  }

  componentDidMount() {
    this.setState({ userActiveZoneNumber: 0, tvStandActiveZoneNumber: 1 });
  }

  render() {
    const {
      userActiveZoneNumber,
      tvStandActiveZoneNumber,
      videoPlaying,
      videoTimeTick,
      finishedZones,
    } = this.state;

    const zones = [0, 1, 2, 3].map(i => {
      const isMetaZone = i === 0;

      return (
        <React.Fragment key={i}>
          {i !== 0 && (
            <div className="laser-trigger" onClick={this.onSensorTrigger.bind(this, i)} />
          )}
          <Zone
            number={i}
            active={userActiveZoneNumber === i}
            isMeta={isMetaZone}
            isFinished={finishedZones[i]}
            onRender={this.saveZone.bind(this)}
            onClick={this.onZoneClick.bind(this)}
          />
        </React.Fragment>
      );
    });

    const userActiveZone = this.zones[userActiveZoneNumber];
    const tvStandActiveZone = this.zones[tvStandActiveZoneNumber];

    return (
      <div className="main">
        <div className="simulator">
          <User zone={userActiveZone} active={videoPlaying} />
          <div className="zones">{zones}</div>
          <TvStand
            zone={tvStandActiveZone}
            time={videoTimeTick}
            onMoveFinished={this.onTvStandMoveFinished.bind(this)}
          />
        </div>
      </div>
    );
  }
}
