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
  ZONE_1_TRIGGER: 'ZONE_1_TRIGGER',
  ZONE_2_TRIGGER: 'ZONE_2_TRIGGER',
  ZONE_3_TRIGGER: 'ZONE_3_TRIGGER',
  TV_STAND_MOVE_TO: 'TV_STAND_MOVE_TO',
  TV_STAND_FINISHED_MOVE: 'TV_STAND_FINISHED_MOVE',
  ZONE_PROCESSING: 'ZONE_PROCESSING',
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

function* simulatorSaga() {
  try {
    while (true) {
      yield take(actions.ZONE_1_TRIGGER);

      console.log(actions.ZONE_1_TRIGGER);
    }
  } finally {
    if (yield cancelled()) {
    }
  }
}

runSaga(createSagaIO(emitter, () => state), simulatorSaga);

const Zone = ({ number, label, active, isMeta, onClick, onRender }) => {
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

  return (
    <div className={cx('zone', { active, meta: isMeta })} onClick={click} ref={onRef}>
      <div className="zone-number">{number}</div>
    </div>
  );
};

const User = ({ zone }) => {
  const left = zone ? zone.left + zone.width / 2 : 0;

  return <div className="user" style={{ left }} />;
};

const TvStand = ({ zone }) => {
  const style = zone ? { left: zone.left + zone.width / 2 } : null;

  return (
    <div className="tv-rail">
      <div
        className="tv-stand"
        style={style}
        onTransitionEnd={e => console.log('tv transition end')}
      />
    </div>
  );
};

export default class App extends React.Component {
  state = {};
  zones = {};

  constructor() {
    super();

    emitter.on('action', action => {
      switch (action.type) {
        case actions.ZONE_1_TRIGGER:
        case actions.ZONE_2_TRIGGER:
        case actions.ZONE_3_TRIGGER:
          this.setState({ userActiveZoneNumber: action.zone.number });
      }
    });
  }

  onTriggerFire(number) {
    console.log('Trigger', number);
  }

  saveZone(zone) {
    this.zones[zone.number] = zone;
  }

  onZoneClick(zone) {
    dispatch({ type: `ZONE_${zone.number}_TRIGGER`, zone });
  }

  componentDidMount() {
    this.setState({ userActiveZoneNumber: 0, tvStandActiveZoneNumber: 1 });
  }

  render() {
    const { userActiveZoneNumber, tvStandActiveZoneNumber } = this.state;
    const zones = [0, 1, 2, 3, 4].map(i => {
      const isMetaZone = i === 0 || i === 4;

      return (
        <React.Fragment key={i}>
          {i !== 0 && <div className="laser-trigger" onClick={this.onTriggerFire.bind(this, i)} />}
          <Zone
            number={i}
            active={userActiveZoneNumber === i}
            isMeta={isMetaZone}
            onRender={this.saveZone.bind(this)}
            onClick={this.onZoneClick.bind(this)}
          />
        </React.Fragment>
      );
    });

    const userActiveZone = this.zones[userActiveZoneNumber];
    const tvStandActiveZone =
      userActiveZone && userActiveZone.isMeta
        ? this.zones[tvStandActiveZoneNumber]
        : userActiveZone;

    return (
      <div className="main">
        <div className="simulator">
          <User zone={userActiveZone} />
          <div className="zones">{zones}</div>
          <TvStand zone={tvStandActiveZone} />
        </div>
      </div>
    );
  }
}
