var cloudant = require('./db.js'),
  gridlog = cloudant.use('gridlog');


var map = function(doc) {
  if(doc.username) {
    emit([ doc.username, doc.grid_name, doc.ts], doc.grid_id);
  } 
};

// create the gridlog database and design doc
cloudant.db.create('gridlog', function(err, data) {
  var obj = {
    _id: "_design/fetch",
    views: {
      byuser: {
        map: map.toString(),
        reduce: "_count"
      }
    }
  }
  gridlog.insert(obj, function(err, data) {

  });
});

var add = function(obj, callback) {
  gridlog.insert(obj, callback);
}

var getList = function(username, callback) {
  gridlog.view('fetch','byuser', { startkey: [ username +"z"] , endkey: [username], descending: true, reduce:false, limit: 100}, function(err, data) {
    callback(err,data); 
  })
};

module.exports = {
  add: add,
  getList: getList
}
