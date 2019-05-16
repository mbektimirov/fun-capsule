const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const port = new SerialPort('/dev/cu.wchusbserial1440');
const parser = new Readline();

port.pipe(parser);

console.log('Listening...');

port.on('data', function(data) {
  console.log('Data:', data.toString('utf8'));
});

let i = 0;

setInterval(() => {
  port.write(`CHECK ${i}`, err => {
    if (err) {
      return console.log('Error on write: ', err.message);
    }

    i++;

    console.log('message written');
  });
}, 1000);
