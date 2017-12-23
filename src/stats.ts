import {PORTS_PLACE_NAMES} from './data/ports-data';

export class Stats {

  private static _instance: Stats;

  private readonly commandsStats: {[command: string]: number} = {};
  private readonly roomsStats: {[room: string]: number} = {};
  private readonly mapsStats: {[map: string]: number} = {};

  static instance(): Stats {
    if (!this._instance) {
      this._instance = new Stats();
    }
    return this._instance;
  }

  private constructor() {}

  // ////////////////////////////////////////////////
  // FUNCTIONS
  // ////////////////////////////////////////////////

  incCommand(command: string) {
    this.commandsStats[command] = (this.commandsStats[command] || 0) + 1;
  }

  incRoomInMsg(room: string) {
    this.roomsStats[room] = (this.roomsStats[room] || 0) + 1;
  }

  incMapRequest(mapName: string) {
    this.mapsStats[mapName] = (this.mapsStats[mapName] || 0) + 1;
  }

  getStats(): string {
    const cmds = Object.keys(this.commandsStats).map(cmd => `/${cmd} ${this.commandsStats[cmd]}`).join('\n');
    const rooms = Object.keys(this.roomsStats).map(r => `${r.toUpperCase()} *${this.roomsStats[r]}*`).join('\n');
    const maps = Object.keys(this.mapsStats).map(map => `${PORTS_PLACE_NAMES[map] || map} *${this.mapsStats[map]}*`).join('\n');

    return `
*Commands:*
${cmds}

*Maps:*
${maps}

*Rooms:*
${rooms}
    `;
  }
}
