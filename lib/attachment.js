var knox = require('knox');

var client = knox.createClient({
    key: process.env.AWS_KEY,
    secret: process.env.AWS_SECRET,
    bucket: process.env.AWS_BUCKET
});

var create = function(obj, callback) {
/*{ fieldname: 'image',
  originalname: 'DSC_0058a.JPG',
  name: '48139ebb17e207dad67f588106d00100.JPG',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  path: '/tmp/48139ebb17e207dad67f588106d00100.JPG',
  extension: 'JPG',
  size: 3436756,
  truncated: false,
  buffer: null }*/
  
  obj.name = obj.name.toLowerCase();
  
  // upload the file to S3
  client.putFile(obj.path, '/'+obj.name, { 'x-amz-acl': 'public-read', 'Content-Type': obj.mimetype }, function(err, res){
    // Always either do something with `res` or at least call `res.resume()`.
    res.resume();
    
    var url = "https://" + process.env.AWS_BUCKET + ".s3.amazonaws.com/" + obj.name;
    var name = obj.name;
    var hash = obj.name.match(/^([a-z0-9]+)/)[0];
    callback(err, { url: url, name: name, hash: hash} );
  });
}

module.exports = {
  create: create
}