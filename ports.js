var unirest = require('unirest');
var q = require('q');
var cheerio = require('cheerio');
var fs = require('fs');
var svg2png = require('svg2png');

// Room object
var room = require('./room');
var Room = room.Room;

// open close time
var OPEN = 8;
var CLOSE = 20;
// counter for the tmp svg and img
var counter = 0;

/*
retrieve infos about room status from Ports
*/
var getPortsData = function () {

	var currentDate = new Date();
	// calculate timeZoneOffset between US and Ita (if service is hosted in US)
	// need to add the offset (from US to Greenwich) and (from Greenwich to Ita)
	currentDate = new Date(currentDate.valueOf() + (currentDate.getTimezoneOffset() * 60000) + (120 * 60000));

	var queryDate = new Date(currentDate);

	queryDate = nextOpenDay(queryDate);
	var now = queryDate.getTime();

	var BASE_URL = 'http://api.trentoleaf.tk/app?time=';
	var requests = [];
	var data = [];

	var extras = [
		{room: "A101", power: true, type: "normal", places: 200},
		{room: "A102", power: true, type: "normal", places: 160},
		{room: "A103", power: true, type: "normal", places: 160},
		{room: "A104", power: true, type: "normal", places: 160},
		{room: "A105", power: true, type: "normal", places: 160},
		{room: "A106", power: true, type: "normal", places: 160},
		{room: "A107", power: true, type: "normal", places: 70},
		{room: "A108", power: true, type: "normal", places: 70},
		{room: "A201", power: true, type: "pc", places: 56},
		{room: "A202", power: true, type: "pc", places: 56},
		{room: "A203", power: true, type: "normal", places: 70},
		{room: "A204", power: true, type: "normal", places: 87},
		{room: "A205", power: true, type: "normal", places: 87},
		{room: "A206", power: true, type: "normal", places: 126},
		{room: "A207", power: true, type: "normal", places: 110},
		{room: "A208", power: true, type: "normal", places: 90},
		{room: "A209", power: true, type: "normal", places: 55},
		{room: "A210", power: true, type: "normal", places: 70},
		{room: "A211", power: true, type: "normal", places: 35},
		{room: "A212", power: true, type: "normal", places: 55},
		{room: "A213", power: true, type: "normal", places: 33},
		{room: "A214", power: true, type: "normal", places: 33},
		{room: "A215", power: false, type: "normal", places: 33},
		{room: "A216", power: false, type: "multipurpose", places: 35},
		{room: "A217", power: false, type: "multipurpose", places: 35},
		{room: "A218", power: false, type: "normal", places: 33},
		{room: "A219", power: true, type: "normal", places: 33},
		{room: "A220", power: true, type: "normal", places: 33},
		{room: "A221", power: true, type: "normal", places: 55},
		{room: "A222", power: true, type: "normal", places: 70},
		{room: "A223", power: true, type: "normal", places: 35},
		{room: "A224", power: true, type: "normal", places: 55},
		{room: "B101", power: false, type: "normal", places: 80},
		{room: "B102", power: false, type: "normal", places: 80},
		{room: "B103", power: false, type: "normal", places: 80},
		{room: "B104", power: false, type: "normal", places: 80},
		{room: "B105", power: false, type: "normal", places: 80},
		{room: "B106", power: true, type: "pc", places: 130},
		{room: "B107", power: false, type: "normal", places: 180}
	];

	// make the request
	console.log("i Getting Ports data, time: " + now);

	var deferred = q.defer(); // wrap the result

	var http = unirest.get(BASE_URL + now)
	.end(function(response) {

		if (response.status == 200) {
			// ok
			var result = response.body;

			for(var i = 0, length = extras.length; i < length; i++) {
				var room = new Room(extras[i].room);

				room.setExtras(extras[i]);
				room.states = result[room.number.toLowerCase()];
				room.calculateAvaiability(queryDate, currentDate);
				room.setFree(13);

				data.push(room);
			}

			console.log("i Ports data retrieved");
			// send data to calling function
			deferred.resolve(data);
		} else {
			// error
			console.log("i No data from Ports");
			deferred.reject();
		}
	});

	return deferred.promise;
};

// useful functions
function nextOpenDay (date) {
	if(date.getHours() >= CLOSE) {
		addDay(date, 1);
	}
	date.setMilliseconds(0);
	date.setSeconds(0);
	date.setMinutes(30);
	date.setHours(7);

	return date;
}

function addDay (date, days) {
	date.setHours(date.getHours() + 24*days);
}

/*
create the image of a floor
*/
var createBuildingImg = function (data, floor) {

	// colors
	var colDarkGreen = "#66BB6A";
	var colGreen = "#66BB6A";
	var colOrange = "orange";
	var colYellow = "#FFCA28";
	var colRed = "#EF5350";
	var colBlue = "#42A5F5";


	var deferred = q.defer();

	// relative path of svgs
	var url = "./img/";

	switch (floor) {
		case 11:
		url = url + "Povo1PT.svg";
		break;
		case 12:
		url = url + "Povo1P1.svg";
		break;
		case 21:
		url = url + "Povo2PT.svg";
		break;
		case 22:
		url = url + "Povo2P1.svg";
		break;
		default:
		break;
	}

	// load svg
	var $ = cheerio.load(fs.readFileSync(url));

	// fill the map
	for(var i = 0, len = data.length; i < len; i++) {

		var className = data[i].number;
		var idClassNameSvg = "#"+className.toLowerCase();
		var rect =  $(idClassNameSvg);

		var status = null;
		if (rect != null){

			switch(data[i].class) {
				case 'dark-green':
				status = colDarkGreen;
				break;
				case 'green':
				status = colGreen;
				break;
				case 'orange':
				status = colOrange;
				break;
				case 'yellow':
				status = colYellow;
				break;
				case 'red':
				status = colRed;
				break;
			}

			rect.attr('fill', status);

			// colore label
			var idLabelSvg= idClassNameSvg+"t";
			var label= $(idLabelSvg);
			if (status==colGreen || status==colRed) {
				label.attr('fill', "white");
			} else {
				label.attr('fill', "#lalala");
			}
		}
	}

	var url_svg_tmp  = "./tmp/tmp" + counter + ".svg";
	counter++;

	fs.writeFile(url_svg_tmp, $.html(), function(error) {
		if (!error) {

			var url_image  = url_svg_tmp.replace("svg", "png");

			// convert to image
			svg2png(url_svg_tmp, url_image, 4.0, function (err) {
				if (!err) {
					// create the caption
					var caption  = "";

					switch (floor) {
						case 11:
						caption = "Polo 1 - 1° Piano";
						break;
						case 12:
						caption = "Polo 1 - 2° Piano";
						break;
						case 21:
						caption = "Polo 2 - 1° Piano";
						break;
						case 22:
						caption = "Polo 2 - 2° Piano";
						break;
					}

					// send image url and caption to calling function
					deferred.resolve({url: url_image, caption: caption});
				} else {
					deferred.reject(err);
				}
			});
		} else {
			deferred.reject(error);
		}
	});

	return deferred.promise;
};

var getRoomImg = function (room) {
	var colBlue = "#42A5F5";

	var deferred = q.defer();

	// relative path of svgs
	var url = "./img/";

	// recognize the room
	if (room[0] == 'a') {
		if (room[1] == '1') {
			url = url + "Povo1PT.svg";
		} else if (room[1] == '2') {
			url = url + "Povo1P1.svg";
		} else {
			deferred.reject("Room not found.");
			return deferred.promise;
		}
	} else if (room[0] == 'b') {
		if (room == 'b106' || room == 'b107') {
			url = url + "Povo2P1.svg";
		} else {
			url = url + "Povo2PT.svg";
		}
	} else {
		deferred.reject("Room not found.");
		return deferred.promise;
	}

	// load svg
	var $ = cheerio.load(fs.readFileSync(url));

	// fill the map
	var className = room;
	var idClassNameSvg = "#"+className.toLowerCase();
	var rect =  $(idClassNameSvg);

	if (rect != null) {
		rect.attr('fill', colBlue);
		// colore label
		var idLabelSvg= idClassNameSvg+"t";
		var label= $(idLabelSvg);
		label.attr('fill', "white");
	}

	// write svg
	var url_svg_tmp  = "./tmp/tmp" + counter + ".svg";
	counter++;

	fs.writeFile(url_svg_tmp, $.html(), function(error) {
		if (!error) {

			var url_image  = url_svg_tmp.replace("svg", "png");

			// convert to image
			svg2png(url_svg_tmp, url_image, 4.0, function (err) {
				if (!err) {
					// send image url and caption to calling function
					deferred.resolve({url: url_image, room: room});
				} else {
					deferred.reject(err);
				}
			});
		} else {
			deferred.reject(error);
		}
	});
	return deferred.promise;
};


exports.createBuildingImg = createBuildingImg;
exports.getPortsData = getPortsData;
exports.getRoomImg = getRoomImg;
