import * as https from 'https';
import * as chalk from 'chalk';
import {readFileSync} from 'fs';
import {join as pathJoin} from 'path';
import {load as cheerioLoad} from 'cheerio';
import {PORTS_ROOMS_EXTRAS} from './data/ports-data';
import {Room} from './model/room';
import {PortsColor, getColor} from './data/ports-color';

import * as sharp from 'sharp';

export class Ports {

  private static _instance: Ports;

  private readonly BASE_URL = 'https://trentoleaf-api.herokuapp.com';

  // private readonly OPEN_HOUR = 8;
  private readonly CLOSE_HOUR = 20;

  private readonly ASSETS_PATH = pathJoin(__dirname, '../assets/');
  private readonly MAP_IMG_NAMES = ['povo1-p1', 'povo1-pt', 'povo2-p1', 'povo2-pt'];

  private readonly MAPS: {[mapName: string]: string};


  static instance(): Ports {
    if (!this._instance) {
      this._instance = new Ports();
    }
    return this._instance;
  }

  private constructor() {

    console.log(chalk.default.blue('> Loading maps...'));
    // Load assets
    this.MAPS = this.MAP_IMG_NAMES.reduce((maps, mapName) => {
      maps[mapName] = this.loadMap(mapName);
      return maps;
    }, {});
    console.log(chalk.default.blue('> Maps loaded!'));
  }


  // ////////////////////////////////////////////////
  // APIs
  // ////////////////////////////////////////////////

  getRoomsAvailability(date: Date): Promise<Room[]> {
    // TODO cache
    const currentDate = date;
    let queryDate = new Date(currentDate);
    queryDate = this.nextOpenDay(date);
    const dateString = queryDate.getTime();

    return new Promise<{[key: string]: boolean[]}>((resolve, reject) => {

      https.get(`${this.BASE_URL}/app?time=${dateString}`, (res) => {
        const {statusCode} = res;

        if (statusCode !== 200) {
          console.error(chalk.default.red(`> Ports Client error (code: ${statusCode})`));
          res.resume();
          return reject(new Error(`Ports client fail (code: ${statusCode})`));
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(rawData);
            return resolve(parsedData);
          } catch (e) {
            console.error(chalk.default.red(e.message));
            return reject(new Error(`Ports client - error while parse response`));
          }
        });
      }).on('error', (e) => {
        console.error(chalk.default.red(e.message));
        return reject(new Error(`Ports client - http error`));
      });

    })
      .then(data => {
        // Convert room info into roo with availability
        return PORTS_ROOMS_EXTRAS.map((roomInfo) => new Room(roomInfo, data[roomInfo.room.toLowerCase()], queryDate, currentDate));
      });
  }

  /**
   * Create the image of a floor
   */
  createBuildingImg(data: Room[], mapName: string = '', mapLabel = ''): Promise<{caption: string; buffer: Buffer}> {
    return new Promise<{caption: string; buffer: Buffer}>(async (resolve, reject) => {

      // Validate map name
      if (this.MAP_IMG_NAMES.indexOf(mapName) === -1 || !this.MAPS[mapName]) {
        return reject(new Error(`Invalid map name: ${mapName}`));
      }

      // Create svg dom
      const $ = this.getMap(mapName);

      // Fill the map with rooms data
      data.forEach(room => {
        const className = room.roomNumber;
        const idClassNameSvg = `#${className.toLowerCase()}`;
        const rect = $(idClassNameSvg);

        if (rect) {
          const status = getColor(room.class);
          rect.attr('fill', status);

          // Label color
          const label = $(`${idClassNameSvg}t`);
          label.attr('fill', (status === PortsColor.GREEN || status === PortsColor.RED) ? 'white' : '#212121');
        }

      });

      // Convert to png
      try {
        const d = await this.getImageAsPng($, mapLabel);
        resolve(d);
      } catch (err) {
        console.error(chalk.default.red(`> Svg to png conversion error: ${err}`));
        reject(err);
      }
    });
  }

  getRoomImg(room: string): Promise<{caption: string; buffer: Buffer}> {
    return new Promise<{caption: string; buffer: Buffer}>(async (resolve, reject) => {

      room = room.toLowerCase();
      let mapName;

      // Recognize the room
      if (room[0] === 'a') {

        if (room[1] === '1') {
          mapName = 'povo1-pt';
        } else if (room[1] === '2') {
          mapName = 'povo1-p1';
        } else {
          return reject(new Error('Room not found'));
        }

      } else if (room[0] === 'b') {

        if (room === 'b106' || room === 'b107') {
          mapName = 'povo2-p1';
        } else {
          mapName = 'povo2-pt';
        }

      } else {
        return reject(new Error('Room not found'));
      }

      if (!mapName) {
        return reject(new Error('Room not found'));
      }

      // Create svg dom
      const $ = this.getMap(mapName);

      // fill the map

      const className = room;
      const idClassNameSvg = `#${className.toLowerCase()}`;
      const rect = $(idClassNameSvg);

      if (rect) {
        rect.attr('fill', PortsColor.BLUE);
        // Label color
        const label = $(`${idClassNameSvg}t`);
        label.attr('fill', 'white');


      }

      // Convert to png
      try {
        const d = await this.getImageAsPng($, `Someone said ${room.toUpperCase()}?`);
        resolve(d);
      } catch (err) {
        console.error(chalk.default.red(`> Svg to png conversion error: ${err}`));
        reject(err);
      }

    });
  }


  // ////////////////////////////////////////////////
  // Functions
  // ////////////////////////////////////////////////


  private getImageAsPng($: CheerioStatic, room: string): Promise<{buffer: Buffer; caption: string}> {

    const sourceBuffer = new Buffer($.html() || '');

    return sharp(sourceBuffer).resize(null as any, 640).png().toBuffer()
      .then((buffer) => ({buffer, caption: room}));
  }

  // private getImageAsPng($: CheerioStatic, room: string): Promise<{buffer: Buffer; caption: string}> {

  //   const sourceBuffer = new Buffer($.html() || '');

  //   return svg2png(sourceBuffer)
  //     .then((buffer) => ({buffer, caption: PORTS_PLACE_NAMES[room]}));
  // }

  private nextOpenDay(date: Date): Date {
    if (date.getHours() >= this.CLOSE_HOUR) {
      // Add 1 day
      date.setHours(date.getHours() + 24 * 1);
    }
    date.setMilliseconds(0);
    date.setSeconds(0);
    date.setMinutes(30);
    date.setHours(7);

    return date;
  }

  private loadMap(mapName: string): string {
    const imgPath = pathJoin(this.ASSETS_PATH, `${mapName}.svg`);

    // Load svg
    try {
      return readFileSync(imgPath, 'utf8');
    } catch (e) {
      console.error(chalk.default.red(`> Error while loading map: ${mapName}`));
      throw e;
    }
  }

  private getMap(mapName: string): CheerioStatic {
    return cheerioLoad(this.MAPS[mapName]);
  }

}
