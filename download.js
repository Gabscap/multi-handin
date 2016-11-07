var requestAsync = require("request");
var cheerio = require("cheerio");
var fs = require("fs");
var mkdirp = require("mkdirp");
var config = require("./config");
var util = require("./util");

const FSEP = "/";
const UPLOAD_STRING = "Upload...";
const GRADE_FILENAME = "grade.rktd";
const GRADE_0_POINTS = "grade0.rktd";
const GRADE_0_SUFFIX = "_";
var ASSIGNMENT_DIR = config.dir + FSEP + config.assignment;

mkdirp.sync(ASSIGNMENT_DIR);

var useGrade0 = util.fileExists(GRADE_0_POINTS);
var done = [];

config.students.forEach(student => {
	var $ = cheerio.load(util.loginStudent(student));
	var assignmentTD = $(".submissions tbody th").filter(function () {
		return $(this).text().trim() === config.assignment;
	}).next();
	var groupName = assignmentTD
		.clone().children().remove().end().text()
		.replace(/:+$/, "")
		.replace(/^Team/, "")
		.trim();
	if (groupName === "" || groupName.indexOf(' ') > -1) {
		groupName = student;
	}
	if (done.indexOf(groupName) <= -1) {
		done.push(groupName);
		var handins = assignmentTD.find("li a").filter(function () {
			return $(this).text().trim() !== UPLOAD_STRING;
		});
		var destDir = ASSIGNMENT_DIR + FSEP + groupName;
		mkdirp.sync(destDir);
		if (handins.length <= 0) {
			console.log("Keine Abgabe:\t" + groupName);
			var gradeFile = destDir + FSEP + GRADE_FILENAME;
			if (useGrade0 && !util.fileExists(gradeFile)) {
				fs.createReadStream(GRADE_0_POINTS).pipe(fs.createWriteStream(gradeFile + GRADE_0_SUFFIX));
			}
		} else {
			console.log("Abgabe:\t\t" + groupName);
			handins.each(function () {
				var filename = $(this).text();
				var url = config.base_url + $(this).attr("href");
				var file = fs.createWriteStream(destDir + FSEP + filename);
				requestAsync(url).pipe(file);
			});
		}
	} else {
		//console.log("Already downloaded assignment: " + groupName);
	}
});
