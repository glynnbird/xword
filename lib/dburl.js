// get Cloudant credentials
var services = process.env.VCAP_SERVICES
var opts = null;
var retval = null;

// parse BlueMix config
if (typeof services != 'undefined') {
  services = JSON.parse(services);
  opts = services.cloudantNoSQLDB[0].credentials;
  retval = opts.url;
} 

module.exports = retval;