var unirest = require('unirest');
var q = require('q');
var cheerio = require('cheerio');
var fs = require('fs');
var svg2png = require('svg2png');
var extend = require('extend');

// Room object
var room = require('./room');
var Room = room.Room;

// open close time
var OPEN = 8;
var CLOSE = 20;
// counter for the tmp svg and img
var counter = 0;

// Cheerio svgs DOMs
var	svg_files = [];

/*
* Initialize the application loading all the svg images
*/
var initModule = function () {

	console.log("i Loading all SVGs DOMs....");

	var base_url = './img/';

	var maps = ["Povo1PT", "Povo1P1", "Povo2PT", "Povo2P1"];


	for (var i in maps) {

		var url = base_url + maps[i] + '.svg';
		// load svg
		var svg_string = fs.readFileSync(url, 'utf8');
		svg_files.push({name: maps[i], svg: svg_string});
	}
};


/*
* retrieve infos about room status from Ports
*/
var getPortsData = function () {

	var currentDate = new Date();
	// calculate timeZoneOffset between US and Ita (if service is hosted in US)
	// need to add the offset (from US to Greenwich) and (from Greenwich to Ita)
	currentDate = new Date(currentDate.valueOf() + (currentDate.getTimezoneOffset() * 60000) + (120 * 60000));

	var queryDate = new Date(currentDate);

	queryDate = nextOpenDay(queryDate);
	var now = queryDate.getTime();

	var BASE_URL = 'https://trentoleaf-api.herokuapp.com/app?time=';
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
	var name = '';

	switch (floor) {
		case 11:
		name = "Povo1PT";
		break;
		case 12:
		name = "Povo1P1";
		break;
		case 21:
		name = "Povo2PT";
		break;
		case 22:
		name = "Povo2P1";
		break;
		default:
		break;
	}

	if (name == '') {
		deferred.reject("Room not found.");
	}

	// get svg dom
	var $;

	for (var i = 0; i < svg_files.length; i++) {
		if (name == svg_files[i].name) {
			$ = cheerio.load(svg_files[i].svg);
			i = svg_files.length;
		}
	}

	if ($ == undefined) {
		deferred.reject("Cheerio dom not found.");
	}

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


	// convert to png
	var sourceBuffer = new Buffer($.html());
	svg2png(sourceBuffer)
	.then(function (buffer) {
		console.log("Converted svg2png");

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
		deferred.resolve({buffer: buffer, caption: caption});
	})
	.catch(function (err) {
		console.log("Conv svg2png error");
		deferred.reject(err);
	});

	return deferred.promise;
};

var getRoomImg = function (room) {
	var colBlue = "#42A5F5";

	var deferred = q.defer();

	var name = '';

	// recognize the room
	if (room[0] == 'a') {
		if (room[1] == '1') {
			name = "Povo1PT";
		} else if (room[1] == '2') {
			name = "Povo1P1";
		} else {
			deferred.reject("Room not found.");
			return deferred.promise;
		}
	} else if (room[0] == 'b') {
		if (room == 'b106' || room == 'b107') {
			name = "Povo2P1";
		} else {
			name = "Povo2PT";
		}
	} else {
		deferred.reject("Room not found.");
		return deferred.promise;
	}

	if (name == '') {
		deferred.reject("Room not found.");
	}

	// get svg dom
	var $;

	for (var i = 0; i < svg_files.length; i++) {
		if (name == svg_files[i].name) {
			$ = cheerio.load(svg_files[i].svg);
			i = svg_files.length;
		}
	}

	if ($ == undefined) {
		deferred.reject("Cheerio dom not found.");
	}

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

	// convert to png
	var sourceBuffer = new Buffer($.html());
	svg2png(sourceBuffer)
	.then(function (buffer) {
		console.log("i Converted svg2png successfully.");
		deferred.resolve({buffer: buffer, room: room});
	})
	.catch(function (err) {
		console.log("! Conversion svg2png error.");
		deferred.reject(err);
	});

	return deferred.promise;
};


/* INITIALIZE MODULE */
initModule();


/* MODULE EXPORTS */

exports.createBuildingImg = createBuildingImg;
exports.getPortsData = getPortsData;
exports.getRoomImg = getRoomImg;
