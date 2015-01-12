
// app.js
var express = require('express'),
  app = express();
  passport = require('passport'), 
  TwitterStrategy = require('passport-twitter').Strategy,
  session = require('express-session'),
  multer  = require('multer'),
  RedisStore = require('connect-redis')(session);

  
  

// handle multi-part uploads
app.use(multer({ dest: '/tmp/'}));
  

// use the jade templating engine
app.set('view engine', 'jade');


// configure sessions  
var options = require('./lib/redisopts.js');
options.host = options.hostname;
options.pass = options.password;
app.use(session({
    store: new RedisStore(options),
    secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize()); 
app.use(passport.session()); 

//setup static public directory
app.use(express.static(__dirname + '/public'));   
  




/*
var bodyParser = require('body-parser'),
  cloudant = require('./lib/db.js')
  
*/





// parse application/x-www-form-urlencoded
//app.use(bodyParser.urlencoded({ extended: false }));

require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

                                     

// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts this application:
var host = (process.env.VCAP_APP_HOST || 'localhost');
// The port on the DEA for communication with the application:
var port = (process.env.VCAP_APP_PORT || 3000);
// Start server
app.listen(port, host);
console.log('App started on port ' + port);


