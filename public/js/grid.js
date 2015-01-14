

/*Key
omeroddeplysipidecuredge
Password
gjrHTpagE1yY2enXRHyIjLUb
*/

var dbname = null;
var db = null;
var auth = null;
var match = location.pathname.match(/^\/grid\/([a-z0-9]+)$/);
var user = null;
var V = 26;
var H = 15;
var S = 22;
var pauseDrawing=false;

if(match) {
  dbname = match[1];
}

var nothingHappens = function() {
  addComment();
  return false;
}

var formatDate = function(ts) {
  var then = moment.unix(ts);
  return then.format("MMM D, HH:mm");
}

var hideThings = function() {
  var checked = $('#hidethings').prop('checked');
  if(checked) {
    $('#annotations').hide();
    $('#chatthing').hide();
  } else {
    $('#annotations').show();
    $('#chatthing').show();
  }
}

var recalibrateGrid = function() {
  S = $('#sslider').slider("value");
  H = $('#hslider').slider("value");
  V = $('#vslider').slider("value");

  db.get("grid", function(err, grid) {
    grid.S=S;
    grid.H=H;
    grid.V=V;
    db.put(grid, function(err, data) {
      drawChat();
    })
  })
};

var dismissCalibrate = function() {
  var h = $('#target').height();
  $('#chatthing').height(h);
}


var addComment = function() {
  if($('#addbox').val().length > 0 ) {
    var obj = {
      type: "chat",
      ts: moment().unix(),
      person: user.displayName,
      img: user.photos[0].value,
      message: $('#addbox').val()
    };
    console.log("OBJECT TO ADD",obj)
    var html = $('#chat').html();;
    html += render(obj);
    $('#chat').html(html);
    $('#chatthing').scrollTop(1E10);
    $('#addbox').val('');
    db.post(obj, function(err, data) {
      console.log("post", err, data,obj);
    });

  }
}

var addAnnotation = function() {
  var direction = $('#annotationdirection').val(),
    txt = $('#annotationtxt').val()
  
  if(txt.length > 0) {
    var obj = {
      type: "annotation",
      ts: moment().unix(),
      person: user.displayName,
      img: user.photos[0].value,
      message: txt,
      direction: direction,
      top: 50,
      left: 50
    };
    var html = $('#chat').html();;
    html += render(obj);
    $('#chat').html(html);
    $('#chatthing').scrollTop(1E10);
    $('#annotationtxt').val('')
    db.post(obj, function(err, data) {
      console.log("post", err, data,obj);
      obj._id = data.id;
      obj._rev = data.rev;
      var h = renderAnnotation(obj);
      var html = $('#annotations').html();
      $('#annotations').html(html + h);
    });
  }

  
}

var render = function(doc) {
  var html = '<li class="left clearfix"><span class="chat-img pull-left">';
  html += '<img src="' + doc.img + '" alt="User Avatar" class="img-circle" />';
  html += '</span><div class="chat-body clearfix"><div class="header">';
  html += '<strong class="primary-font">' + doc.person + '</strong> <small class="pull-right text-muted">';
  html +=  '<span class="glyphicon glyphicon-time"></span>' + formatDate(doc.ts) + '</small>';
  html +=  '</div><p>' 
  if(doc.type=='annotation') {
    var str = doc.message;
    var m = str.match(/-/g);
    if( m &&  m.length == str.length) {
      return "";
    }
    html += doc.message.toUpperCase()
  } else {
    doc.message = doc.message.replace(/\(dance\)/g, "<img src=\"/img/dancing.png\" class=\"emoticon\" />");
    doc.message = doc.message.replace(/\(ninja\)/g, "<img src=\"/img/ninja.png\" class=\"emoticon\" />");
    html += doc.message;
  }
  html += '</p></div></li>';
  return html;
}

var renderAnnotation = function(doc) {
  var c="";
  if(doc.direction=="down") {
    c = "vertical"
  }
  var html = '<div ';
  
  html += '<div id="' + doc._id + '" class="annotation '+c+'" style="top:' + doc.top + 'px; left:'+doc.left+'px; ';
  html += 'font-size:' + S + 'px;'
  var str = doc.message.toLowerCase();
  var m = str.match(/-/g);
  if( m &&  m.length == str.length) {
    var word = str
  } else {
    var word = str.replace(/\W/g,"");
  }
  if(doc.direction=="down") {
    html += 'line-height:' + V + 'px">'
    html += word.split('').join(' ')
  } else {
    html += 'letter-spacing:' + H + 'px">'    
    html += word;
  }
  html += '</div>';
  return html;
}
var map1 = function(doc) {
  if(doc.type && doc.ts) {
    emit(doc.ts, null);
  }
}

var map2 = function(doc) {
  if(doc.type) {
    emit(doc.type, null);
  }
}

var drawChat = function() {
  console.log("redraw");
  db.get("grid", function(err, grid) {
    V = grid.V;
    S = grid.S;
    H = grid.H;

    db.query(map1, { include_docs: true, limit:100, descending:true}, function(err, data) {
      if(err) {
        console.log("err",err);
        return;
      }
      var rows = data.rows;
      rows = rows.reverse();
      var html = "";
      for(var i in rows) {
        var row = rows[i];
        html += render(row.doc);
      }
      $('#chat').html(html);
      $('#chatthing').scrollTop(1E10);
    });
  
    db.query(map2, {include_docs:true, key:"annotation"}, function(err, data) {
      console.log("Annotations", err, data);
      if(err) {
        console.log("err",err);
        return;
      }
      var rows = data.rows;
      var html = "";
      for(var i in rows) {
        var row = rows[i];
        html += renderAnnotation(row.doc);
      }
      $('#annotations').html(html);
      $("#chatthing").draggable();
      $( ".annotation" ).draggable({
        start: function(event, ui) {
          pauseDrawing = true;
        },
        stop: function( event, ui ) { 
          pauseDrawing = false;
          // fetch this id from the DB
          console.log("id",event.target.id);
          var id = event.target.id;
          db.get(id, function(err, doc) {
  /*          console.log("got doc", err, doc);
            console.log("postion", ui.position); 
            console.log("offset", ui.offset); */
            pauseDrawing = false;
            var target = $('#target');
            var top = ui.offset.top - target.offset().top;
            var left = ui.offset.left;
            
            //console.log("top",top, "left",left);
            if(top<0 || left < 0 || top > target.height() || left > target.width() ) {
              console.log("OUT OF BOUNDS");
              db.remove(doc._id, doc._rev, function(err, data) {
                console.log("PUT", err, data);
              });
            } else {
              doc.top = top;
              doc.left = left;
              db.put(doc, function(err, data) {
                console.log("PUT", err, data);
              });
            }
          
        
            console.log("id",event.target.id)
          })
        

        }
      });
    });
  });

  
}

if(dbname) {
  $(document).ready(function () {
//    console.log("pos", $('#target').position());
           
    $("body").css("overflow", "hidden");
    
    $.ajax( {
      url: "/auth.json", 
      dataType: "json",
      success: function(data) {
        auth = data;
        db = new PouchDB("grid_"+dbname);
        user = data.user;
        console.log("USER",user);
        var url = auth.cloudanturl + "/grid_" + dbname;
        console.log("syncing to", url);
        db.sync(url, {live: true})
        .on('change', function (info) {
           // handle change
//          console.log("SYNC change",info);
          
         }).on('uptodate', function (info) {
           // handle up-to-date
           //console.log("SYNC uptodate",info);
           var h = $('#target').height() - $('#calibration').height() - 40;
           $('#chatthing').height(h);
           drawChat();
         }).on('error', function (err) {
           // handle error
           //console.log("SYNC error",err);
         });
       
       
       
         db.get("grid", function(err, grid) {
           if(!err) {
             S=grid.S;
             H=grid.H;
             V=grid.V;
           }
           $('#sslider').slider({ min:8, max:40,value:S, change: function() { 
             recalibrateGrid();
           }});
           $('#hslider').slider({ min:8, max:40,value:H, change: function() { 
             recalibrateGrid();
           }});
           $('#vslider').slider({ min:8, max:40,value:V, change: function() { 
             recalibrateGrid();
           }});
         });
       
       }});


  });
}
