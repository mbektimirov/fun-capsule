import React from 'react';
import cx from 'classnames';
import io from 'socket.io-client';
import { createEventBus } from '../event-bus';

const actions = require('../actions');

/*
- Датчик входа в Зону 1
- Датчик входа в Зону 2
- Датчик входа в Зону 3
- Видеостена
- Свет
- Мобильная стойка:
  - дисплей (телевизор),
  - камера с возможностью управления перемещением по горизонтали,
  - камера с возможностью управления перемещением по вертикали,
  - механизм, перемещающий мобильную стойку между тремя конечными положениями
 */

const socket = io.connect('http://localhost:5000');
const { emitter, dispatch } = createEventBus('client');

socket.on('action', action => {
  console.log('SOCKET', action);
  dispatch(action);
});

emitter.on('action', action => {
  if (action.source !== 'server') {
    socket.emit('action', action);
  }
});

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

const Logs = ({ logs = [] }) => {
  return (
    <div className="logs">
      {logs.map(({ type, payload }, i) => (
        <div key={i} className="log-entry">
          <div>{type}</div>
          <div>{payload && JSON.stringify(payload)}</div>
        </div>
      ))}
    </div>
  );
};

export default class App extends React.Component {
  state = {
    finishedZones: {},
    logs: [],
  };
  zones = {};
  logs = [];

  constructor() {
    super();

    let videoTickTimer;

    emitter.on('action', action => {
      this.logs.push(action);
      this.setState({ logs: this.logs });

      switch (action.type) {
        case actions.INIT:
          this.setState({
            userActiveZoneNumber: 0,
            tvStandActiveZoneNumber: 1,
          });
          break;
        case actions.ZONE_ACTIVATED:
          if (this.state.tvStandActiveZoneNumber === action.payload.zoneNumber) {
            dispatch(actions.TV_STAND_MOVE_FINISHED);
          }

          this.setState({
            userActiveZoneNumber: action.payload.zoneNumber,
            tvStandActiveZoneNumber: action.payload.zoneNumber,
          });

          break;
        case actions.VIDEO_START:
          this.setState({ videoPlaying: true });

          videoTickTimer = setInterval(() => {
            if (this.state.videoTimeTick >= 5) {
              dispatch(actions.VIDEO_FINISHED);
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
              [action.payload.zoneNumber]: true,
            },
          });
          break;
      }
    });
  }

  onSensorTrigger(sensorNumber) {
    dispatch(actions.SENSOR_TRIGGER, { sensorNumber });
  }

  onTvStandMoveFinished(zone) {
    dispatch(actions.TV_STAND_MOVE_FINISHED);
  }

  saveZone(zone) {
    this.zones[zone.number] = zone;
  }

  onZoneClick(zone) {
    // dispatch({ type: `ZONE_${zone.number}_TRIGGER`, zone });
  }

  start() {
    dispatch(actions.START);
  }

  render() {
    const {
      userActiveZoneNumber,
      tvStandActiveZoneNumber,
      videoPlaying,
      videoTimeTick,
      finishedZones,
      logs,
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
        <div className="actions">
          <button onClick={this.start.bind(this)}>Start</button>
          <button
            onClick={() => {
              this.logs = [];
              this.setState({ logs: [] });
            }}
          >
            Clear
          </button>
          <Logs logs={logs} />
        </div>
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
