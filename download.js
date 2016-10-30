var requestAsync = require('request');
var request = require('sync-request');
var cheerio = require('cheerio');
var fs = require('fs');
var mkdirp = require('mkdirp');
var config = require("./config");

var FSEP = "/";
var UPLOAD_STRING = "Upload...";
var ASSIGNMENT_DIR = config.dir + FSEP + config.assignment;

mkdirp.sync(ASSIGNMENT_DIR);

var done = [];

config.students.forEach(function (student) {
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

	var $ = cheerio.load(res.getBody());
	var assignmentTD = $(".submissions tbody th").filter(function () {
		return $(this).text().trim() === config.assignment;
	}).next();
	var groupName = assignmentTD
		.clone().children().remove().end().text()
		.replace(/:+$/, "")
		.replace(/^Team/, "")
		.trim();
	if (groupName === "") {
		groupName = student;
	}
	if (done.indexOf(groupName) <= -1) {
		done.push(groupName);
		var handins = assignmentTD.find("li a").filter(function () {
			return $(this).text().trim() !== UPLOAD_STRING;
		});
		if (handins.length <= 0) {
			console.log("Keine Abgabe:\t" + groupName);
		} else {
			console.log("Abgabe:\t\t" + groupName);
			handins.each(function () {
				var filename = $(this).text();
				var url = config.base_url + $(this).attr("href");
				var destDir = ASSIGNMENT_DIR + FSEP + groupName;
				mkdirp.sync(destDir);
				var file = fs.createWriteStream(destDir + FSEP + filename);
				requestAsync(url).pipe(file);
			});
		}
	} else {
		//console.log("Already downloaded assignment: " + groupName);
	}
});

function jsonToFormData(obj) {
	var str = [];
	for(var p in obj)
	str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
	return str.join("&");
}
