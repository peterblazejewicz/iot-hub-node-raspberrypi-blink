var wpi = require('wiring-pi');

// GPIO pin of the LED
var CONFIG_PIN = 7;
// Blinking interval in msec
var TIMEOUT = 2000;

wpi.setup('wpi');
wpi.pinMode(CONFIG_PIN, wpi.OUTPUT);

var isLedOn = false;

setInterval(function () {
  isLedOn = !isLedOn;
  wpi.digitalWrite(CONFIG_PIN, isLedOn ? 1 : 0);
}, TIMEOUT);
