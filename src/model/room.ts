import {RoomInfo} from './room-info';

export class Room {

  roomNumber: string;
  building: '1' | '2';
  floor: '-1' | '0';

  availability: number;
  states: boolean[];

  free: boolean;
  class: 'red' | 'orange' | 'yellow' | 'green' | 'dark-green';

  card: boolean;

  type: string;
  power: string;
  places: number;
  size: 'tiny' | 'small' | 'middle' | 'big' | 'huge';

  constructor(info: RoomInfo, states: boolean[], queryTime: Date, currentTime: Date) {
    this.roomNumber = info.room;
    this.building = (this.roomNumber.indexOf('A') !== -1) ? '1' : '2';
    this.floor = (this.roomNumber === 'B106' || this.roomNumber === 'B107') ? '0' : (+this.roomNumber.slice(1) < 200 ? '-1' : '0');

    this.states = states;

    // Set extras
    this.type = info.type;
    this.power = `${info.power}`;
    this.places = info.places;

    if (this.places <= 40) {
      this.size = 'tiny';
    } else if (this.places <= 55) {
      this.size = 'small';
    } else if (this.places <= 90) {
      this.size = 'middle';
    } else if (this.places <= 160) {
      this.size = 'big';
    } else {
      this.size = 'huge';
    }

    this.card = (this.building === '2');

    // availability -> zero as default
    this.availability = 0;


    this.calculateAvaiability(queryTime, currentTime);

    this.free = (this.availability === 13);
  }

  private calculateAvaiability(queryTime: Date, currentTime: Date) {

    if (this.states.length === 0) {
      throw new Error(`Please set variable "states" before calling this method`);
    }

    let diff = 0;
    if (queryTime.getTime() < currentTime.getTime()) {
      diff = currentTime.getHours() - queryTime.getHours();
    }

    // calcolo disponibilità da quest'ora
    for (let i = diff; i < this.states.length; i++) {
      if (this.states[i]) {
        this.availability += 1;
      } else {
        break;
      }
    }

    // set color
    switch (this.availability) {
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
  }

}
