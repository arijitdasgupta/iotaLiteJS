var express =    require('express');
var _ =          require('lodash');
var bodyParser = require('body-parser')

var iota =       require('./iota.js');
var Bulb =       require('./bulb.js');
var config =     require('./config.js');

// Will me assigned over the incoming bulb data
const defaultColorValue = {
  red: 255,
  green: 255,
  blue: 255,
  alpha: 200
};

// The stateful components
var webapp, bulbs;

var initiateBulbs = ()=>{
  bulbs = _.map(config.bulbMACs, (bulbMAC)=>{
    return new Bulb(bulbMAC);
  })
}

var initiateApp = ()=>{
  webapp = express();
  webapp.use(bodyParser.json());

  webapp.post('/', function(req, res){
    // Getting the data
    console.log(req.body);
    var newData = req.body;
    _.forEach(newData.bulbs, (bulbData, index)=>{
      // If there is a legitimate object
      if(!_.isString(bulbData) && _.isObject(bulbData)){
        var colorData = _.assign(defaultColorValue, bulbData);
        bulbs[index].writeToBulb(iota.colorValue(colorData));
      }
      // Of just turn if off
      else if(bulbData === "off"){
        bulbs[index].writeToBulb(iota.toggle(false));
      }
    });
    res.write('DONE');
    res.end();
  });

  webapp.listen(7000, ()=>{
    console.log('Webapp listening on 7000');
  });
}

var initiateEventHandlers = ()=>{
  // Making sure things get properly terminated when disconnected
  var killer = ()=> {
    _.forEach(bulbs, (bulb)=>{
      console.log('Terminating daemon for', bulb.stateInfo.macId);
      bulb.killDaemon();
    });
    process.exit(0);
  };

  process.on('SIGINT', killer);
  process.on('SIGTERM', killer);
}

// Main entry point
var init = ()=>{
  initiateBulbs();
  initiateEventHandlers();
  initiateApp();
}

// If it's the main, start-it up!
if(!module.parent){
  init();
}
