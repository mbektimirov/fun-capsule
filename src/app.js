import React from 'react';
import cx from 'classnames';

const STATES = {
  INIT: 'INIT',
  ZONE_TRIGGERED: 'ZONE_TRIGGERED',
  ZONE_PROCESSING: 'ZONE_PROCESSING',
  FINISH: 'FINISH',
};

const Zone = ({ number, active, isMeta, onClick }) => {
  const zoneRef = React.createRef();

  const click = () => {
    onClick &&
      onClick({
        number,
        left: zoneRef.current.offsetLeft,
        top: zoneRef.current.offsetTop,
        width: zoneRef.current.offsetWidth,
      });
  };

  return (
    <div className={cx('zone', { active, meta: isMeta })} onClick={click} ref={zoneRef}>
      <div className="zone-number">{number}</div>
    </div>
  );
};

const User = ({ zone }) => {
  const left = zone ? zone.left + zone.width / 2 : 0;
  // const top = zone ? zone.top * 3 : '50%';

  return <div className="user" style={{ left }} />;
};

export default class App extends React.Component {
  state = {
    activeZone: { number: 0 },
  };

  onTriggerFire(number) {
    console.log('Trigger', number);
  }

  onZoneClick(zone) {
    this.setState({ activeZone: zone });
  }

  render() {
    const { activeZone } = this.state;
    const zones = [0, 1, 2, 3, 4].map(i => {
      const isMetaZone = i === 0 || i === 4;

      return (
        <>
          {i !== 0 && <div className="laser-trigger" onClick={this.onTriggerFire.bind(this, i)} />}
          <Zone
            number={i}
            active={activeZone && activeZone.number === i}
            isMeta={isMetaZone}
            onClick={this.onZoneClick.bind(this)}
            key={i}
          />
        </>
      );
    });

    return (
      <div className="main">
        <div className="simulator">
          <User zone={this.state.activeZone} />
          <div className="zones">{zones}</div>
        </div>
      </div>
    );
  }
}
