// sign up a new user (uniquely identified by mobile or email)
// creating a new database and assigning an api key & password for access to it
/*var signUp = function(mobile, email, appname, callback) {
  
  // create a hash of the mobile or the email
  var crypto = require('crypto'),
    shasum = crypto.createHash('sha1');
  if(mobile && mobile.length>0) {
    shasum.update(mobile);
  } else {
    shasum.update(email);
  }
  
  // formulate a database name
  var dbname = appname.replace(/[^A-Za-z0-9]/g,'').toLowerCase() + "_" + shasum.digest('hex');
  
  // create a new database
  cloudant.db.create(dbname, function(err, body) {

    // create an api key
    cloudant.generate_api_key(function(er, api) {
      if (er) {
        return callback(err, null);
      }
      
      // set the permissions of that key
      cloudant.set_permissions({database:dbname, username:api.key, roles:['_reader','_writer']}, function(er, result) {
        if (er) {
          return callback(err, null);
        }
        
        // return the api key, database name and hostname
        api.db = dbname;
        var parsed = url.parse(cloudant.config.url);
        api.host = parsed.host
        callback(null, api);

      })
    });
  });
};*/


var cloudanturl = require('../lib/dburl.js'),
  attachment = require('../lib/attachment.js'),
  cloudant = require('../lib/db.js'),
  gridlog = require('../lib/gridlog.js'),
  moment = require('moment');

module.exports = function(app, passport) {

  // calculate application url
  var domain = "localhost:3000";
  if(process.env.VCAP_APPLICATION) {
    var vcap_app = JSON.parse(process.env.VCAP_APPLICATION);
    domain = vcap_app.application_uris[0];
  }

  // configure passport
  passport.use(new TwitterStrategy({
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: "http://" + domain + "/auth/twitter/callback"
    },
    function(token, tokenSecret, profile, done) {
      done(null, profile);
    }
  ));
  
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

  // need to have HTTP 200 at "/" or Bluemix reboots the service
  app.get('/', function(req,res) {
    var obj = {
      user: req.user
    };
    if(req.user) {
      gridlog.getList(req.user.username, function(err,data) {
        var things = [ ];
        for(var i in data.rows) {
          var thing = {
            grid_id: data.rows[i].value,
            name: data.rows[i].key[1]
          }
          things.push(thing)
        }
        obj.recents = things;
        res.render('home', obj); 
      })
    } else {
     res.render('home', obj);
    }

  })
  
  app.get('/auth.json', function(req, res) {
    var obj = {
      cloudanturl: cloudanturl,
      user: req.user
    };
    if(obj.user) {
      res.send(obj);
    } else {
      res.status(403).send({});
    }
  });


  // fetch a grid
  app.get('/grid/:id', function(req,res) {
    if (req.user) {
      
      // ensure that the grid exists
      var id = req.params.id;
      var user = req.user;
      var db = cloudant.use("grid_"+id);
      db.get("grid", function(err, data) {
        if(err) {
          res.redirect("/");
          return;
        }
        
        var obj = {
          id: id,
          grid: data,
          user: user
        };
        res.render('grid', obj);
        
        // record in the gridlog

        var obj2 = {
          username: user.username,
          grid_id: id,
          grid_name: data.name,
          ts: moment().unix()
        };
        gridlog.add(obj2, function(err, data) {
        });
      });
      

    } else {
      res.redirect("/");
    }

  });

  app.get("/addform", function(req, res) {
    if(req.user) {
      res.render('addform', {user:req.user});
    } else {
      res.redirect("/");
    }
  });
  
  app.post("/add", function(req, res) {
    if(req.user) {
      attachment.create(req.files.image, function(err,data) {
        var n = 'grid_' + data.hash;
        cloudant.db.create(n, function(err,d) {
          var db = cloudant.use(n);
          var doc = { _id:"grid", type: "grid", name: req.body.name, img: data.url, S: 22, H:15, V:26, creator: req.user.username};
          var docs = [ ];
          docs.push(doc);
          docs.push({
            "type": "annotation",
            "ts": moment().unix(),
            "seq": 0,
            "person": req.user.displayName,
            "img": req.user.photos[0].value,
            "message": "ACROSS",
            "direction": "across",
            "top": 50,
            "left": 50
          });
          docs.push({
            "type": "annotation",
            "ts": moment().unix(),
            "seq": 0,
            "person": req.user.displayName,
            "img": req.user.photos[0].value,
            "message": "DOWN",
            "direction": "down",
            "top": 100,
            "left": 100
          });
          db.bulk({docs:docs},  function(err, d) {
            res.redirect("/grid/"+data.hash)
          });
        });
      });
    } else {
      res.redirect("/");
    }
  });

  app.get("/login", function(req, res) {
    res.send({ ok: true});
  });
  
  app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });
  
  // Passport routes
  app.get('/auth/twitter', passport.authenticate('twitter'));
  app.get('/auth/twitter/callback',  passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/login' }));

  



};