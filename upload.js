var requestAsync = require("request");
var request = require("sync-request");
var cheerio = require("cheerio");
var fs = require("fs");
var mkdirp = require("mkdirp");
var FormData = require("form-data");
var util = require("./util");
var config = require("./config");

const FSEP = "/";
const UPLOAD_STRING = "Upload...";
const GRADE_FILENAME = "grade.rktd";
var ASSIGNMENT_DIR = config.dir + FSEP + config.assignment;

mkdirp.sync(ASSIGNMENT_DIR);

fs.readdirSync(ASSIGNMENT_DIR).forEach(groupName => {
	var gradeFile = ASSIGNMENT_DIR + FSEP + groupName + FSEP + GRADE_FILENAME;
	if (util.fileExists(gradeFile)) {
		var loginName = groupName.replace(/\+.*/, "");

		var $ = cheerio.load(util.loginStudent(loginName));
		var assignmentTD = $(".submissions tbody th").filter(function () {
			return $(this).text().trim() === config.assignment;
		}).next();
		var uploadURL = assignmentTD.find("li a").filter(function () {
			return $(this).text().trim() === UPLOAD_STRING;
		}).attr("href");
		if (!uploadURL) {
			console.log("error uploading " + groupName);
			return;
		}

		var res = request("GET", config.base_url + uploadURL);
		if (res.statusCode != 200) {
			console.log("error u1: " + student);
			return;
		}
		var $ = cheerio.load(res.getBody());
		var formURL = $("form").attr("action");

		var form = new FormData();
		form.append("post", "Upload");
		form.append("file", fs.createReadStream(gradeFile), { filename: GRADE_FILENAME, contentType : "application/octet-stream" });
		var req = requestAsync.post({
			url: config.base_url + formURL,
			headers: form.getHeaders()
		});
		form.pipe(req);
		req.on("response", function (res) {
			if (res.statusCode != 200) {
				console.log("error u2: " + loginName + ", status: " + res.statusCode);
			}
		}).on("data", function (data) {
			var $ = cheerio.load(data);
			var pointsTD = $(".submissions tbody th").filter(function () {
				return $(this).text().trim() === config.assignment;
			}).next().next();
			console.log(pointsTD.text() + "\tPunkte für " + groupName);
		});
	}
});

