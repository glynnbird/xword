// get Cloudant credentials
var services = process.env.VCAP_SERVICES
var opts = null;
var retval = null;

// parse BlueMix config
if (typeof services != 'undefined') {
  services = JSON.parse(services);
  retval = services.rediscloud[0].credentials;
} 

module.exports = retval;