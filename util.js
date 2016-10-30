var request = require("sync-request");
var config = require("./config");
var cheerio = require("cheerio");
var fs = require("fs");


function jsonToFormData(obj) {
	var str = [];
	for(var p in obj)
	str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
	return str.join("&");
}

module.exports = {
	loginStudent: function (student) {
		var res = request("GET", config.base_url + "?student=" + student);
		if (res.statusCode != 200) {
			console.log("error 1: " + student);
			return;
		}
		var $ = cheerio.load(res.getBody());
		var login_suffix = ($(".status-login").attr("action"));
	
		var res = request("POST",
			config.base_url + login_suffix,
			{
				headers: { "content-type": "application/x-www-form-urlencoded" },
				body: jsonToFormData({ user: config.user, passwd: config.password }),
				followRedirects: true
			});
		if (res.statusCode != 200) {
			console.log("error 2: " + student);
			return;
		}
		return res.getBody();
	},
	fileExists: function (path) {
		try {
			fs.accessSync(path, fs.F_OK);
			return true;
		} catch (e) {
			return false;
		}
	}
};
