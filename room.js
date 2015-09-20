// Room object

String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

// definition of Room object
var Room = function(number) {
    this.number = number + '';
    this.building = this.number.contains('A') ? 1 : 2;
    this.floor = (this.number == 'B106' || this.number == 'B107') ? 0 : (this.number.slice(1) < 200 ? -1 : 0);

    // disponibilità di default nulla
    this.availability = 0;
    this.states = [];
};

Room.prototype.calculateAvaiability = function(queryTime, currentTime) {

    if(this.states.length == 0) {
        throw "Please set variable 'states' before calling this method";
    }

    var diff = 0;
    if(queryTime.getTime() < currentTime.getTime()) {
        diff = currentTime.getHours() - queryTime.getHours();
    }

    // calcolo disponibilità da quest'ora
    for(var i = diff; i < this.states.length; i++) {
        if(this.states[i]) {
            this.availability += 1;
        } else {
            break;
        }
    }

    // set color
    switch(this.availability) {
        case 0:
        this.class = 'red';
        break;

        case 1:
        case 2:
        this.class = 'orange';
        break;

        case 3:
        case 4:
        this.class = 'yellow';
        break;

        case 5:
        case 6:
        this.class = 'green';
        break;

        default:
        this.class = 'dark-green';
    }
};

Room.prototype.setFree = function(n) {
    this.free = (this.availability == n);
};

Room.prototype.setExtras = function(o) {
    this.type = o.type;
    this.power = o.power;
    this.places = o.places;

    if(this.places <= 40) {
        this.size = 'tiny';
    } else if(this.places <= 55) {
        this.size = 'small';
    } else if (this.places <= 90) {
        this.size = 'middle';
    } else if(this.places <= 160) {
        this.size = 'big';
    } else {
        this.size = 'huge';
    }

    this.card = (this.building == 2);
};


exports.Room = Room;
