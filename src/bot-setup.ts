import {Telegraf, ContextMessageUpdate} from 'telegraf/typings';
import {PORTS_PLACE_NAMES, ROOMS} from './data/ports-data';
import {Room} from './model/room';
import {Ports} from './ports';
import {Stats} from './stats';

import * as chalk from 'chalk';

enum COMMAND {
  START = 'start',
  HELP = 'help',
  STATS = 'stats',

  AVAILABILITY = 'availability',
  AVAILABILITY_10 = 'availability10',
  MAP = 'map'
}

const START_MSG = `
*PORTS* - "_Povo Offer Rooms To Study_"

Check the Povo's rooms availability with Ports!
Need help? Use /help (😉)
`;

const HELP_MSG = `
*PORTS* - "_Povo Offer Rooms To Study_"

_Commands:_
 - /${COMMAND.AVAILABILITY} Show the list of rooms and their availability
 - /${COMMAND.AVAILABILITY_10} Show top 10 "most available" rooms
 - /${COMMAND.MAP} Show a map of Povo's building with and rooms availability
 `;

const PRESIDENT_USERNAME = 'povopresident';
const VICEPRESIDENT_USERNAME = 'povovicepresident';

export class BotSetup {

  private static readonly MIDDLEWARES = [BotSetup.presidentMiddleware, BotSetup.vicePresidentMiddleware, BotSetup.willyMiddleware];

  private static VP_COUNTER = 0;

  // Get Ports instance
  private static ports = Ports.instance();
  // Get Stats instance
  private static stats = Stats.instance();

  static setupBot(bot: Telegraf<ContextMessageUpdate>) {

    // Setup for groups
    (bot as any).telegram.getMe().then((botInfo) => {
      (bot as any).options.username = botInfo.username;
    });

    // Stats middleware
    this.setupMiddlewares(bot);


    // Start message ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    (bot as any).start((async ({replyWithMarkdown}: ContextMessageUpdate) => {
      try {
        await replyWithMarkdown(START_MSG);

        this.stats.incCommand(COMMAND.START);
      } catch (err) {
        this.printErr(COMMAND.START, err);
      }
    }) as any);

    // Help message ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    bot.command(COMMAND.HELP, (async ({replyWithMarkdown}: ContextMessageUpdate) => {
      try {
        await replyWithMarkdown(HELP_MSG);

        this.stats.incCommand(COMMAND.HELP);
      } catch (err) {
        this.printErr(COMMAND.HELP, err);
      }
    }) as any);

    // Stats ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    bot.command(COMMAND.STATS, (async ({from, chat, replyWithMarkdown}: ContextMessageUpdate) => {
      try {
        if (from && chat && from.username === 'andr35' && chat.type === 'private') {
          await replyWithMarkdown(this.stats.getStats());
        }
      } catch (err) {
        this.printErr(COMMAND.STATS, err);
      }
    }) as any);


    // Availability ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    (bot as any).command(COMMAND.AVAILABILITY, ...this.MIDDLEWARES, (async ({reply, replyWithMarkdown}: ContextMessageUpdate) => {

      try {
        const data = await this.ports.getRoomsAvailability(new Date());
        const text = this.roomListMsg(data);
        await replyWithMarkdown(text);

        this.stats.incCommand(COMMAND.AVAILABILITY);
      } catch (err) {
        this.replyErr(COMMAND.AVAILABILITY, err, reply);
      }
    }) as any);

    // Availability Top 10 ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    (bot as any).command(COMMAND.AVAILABILITY_10, ...this.MIDDLEWARES, (async ({reply, replyWithMarkdown}: ContextMessageUpdate) => {

      try {
        const data = await this.ports.getRoomsAvailability(new Date());
        const text = this.roomListMsg(data, 10);
        await replyWithMarkdown(text);

        this.stats.incCommand(COMMAND.AVAILABILITY_10);
      } catch (err) {
        this.replyErr(COMMAND.AVAILABILITY_10, err, reply);
      }
    }) as any);


    // Map choose ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    (bot as any).command(COMMAND.MAP, ...this.MIDDLEWARES, (async ({reply}: ContextMessageUpdate) => {
      try {
        await reply('Maps', {
          reply_markup: {
            keyboard: [
              [{text: PORTS_PLACE_NAMES['povo1-p1']}, {text: PORTS_PLACE_NAMES['povo2-p1']}],
              [{text: PORTS_PLACE_NAMES['povo1-pt']}, {text: PORTS_PLACE_NAMES['povo2-pt']}],
            ]
          }
        });

        this.stats.incCommand(COMMAND.MAP);
      } catch (err) {
        this.replyErr(COMMAND.MAP, err, reply);
      }
    }));


    // Map image ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    (bot as any).hears(Object.keys(PORTS_PLACE_NAMES).map(k => PORTS_PLACE_NAMES[k]), ...this.MIDDLEWARES,
      (async (ctx: ContextMessageUpdate) => {
        try {
          const mapLabel = ctx['match'];
          const mapName = Object.keys(PORTS_PLACE_NAMES).filter(key => PORTS_PLACE_NAMES[key] === mapLabel)[0];
          ctx.replyWithMarkdown('_Ok, Just a sec, i\'m drawing the map..._');
          const data = await this.ports.getRoomsAvailability(new Date());
          const {buffer, caption} = await this.ports.createBuildingImg(data, mapName, mapLabel);
          await ctx.replyWithPhoto({source: buffer}, {
            caption,
            reply_markup: {
              remove_keyboard: true
            }
          });

          this.stats.incMapRequest(mapName);
        } catch (err) {
          this.replyErr(`${COMMAND.MAP} - Photo`, err, ctx.reply);
        }
      }) as any);


    // Specific Room ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    // lower and uppder case room names -> regex for room name alone or in a sentence.
    bot.hears(ROOMS.map(r => new RegExp(`(^|[.*\\s])(${r})([\\s.*]|$)`, 'i')), // i -> case insensitive
      (async (ctx: ContextMessageUpdate) => {
        try {
          const match: string[] = ctx['match'];
          console.log('match!', typeof match, match);
          const room = match[2];
          const {buffer, caption} = await this.ports.getRoomImg(room);
          await (Math.random() > 0.1) ? ctx.replyWithPhoto({source: buffer}, {caption}) : ctx.replyWithSticker({source: buffer});

          this.stats.incRoomInMsg(room.toLowerCase());
        } catch (err) {
          this.printErr(COMMAND.MAP, err);
        }
      }) as any
    );

  }

  private static setupMiddlewares(bot: Telegraf<ContextMessageUpdate>) {

    // Handle errors
    (bot as any).catch(err => {
      console.error(chalk.default.bold.red('> Bot error!'), err);
    });

  }

  private static roomListMsg(data: Room[], limit?: number): string {

    const rooms = (limit ? data.splice(0, limit) : data)
      .sort((a, b) => b.availability - a.availability);

    const text = limit ? `_TOP ${limit} FREE ROOMS_\n\n` : '_ROOM AVAILABILITY_\n\n';

    return text + rooms
      .map(room => {
        switch (room.class) {
          case 'dark-green':
            return `📗 *${room.roomNumber}*: All day free`;
          case 'green':
            return `📗 *${room.roomNumber}*: Free for ${room.availability} hours`;
          case 'yellow':
            return `📒 *${room.roomNumber}*: Free for ${room.availability} hours`;
          case 'orange':
            return `📙 *${room.roomNumber}*: Free for only ${room.availability} hours`;
          case 'red':
            return `📕 *${room.roomNumber}*: Not available`;
          default:
            return `📘 *${room.roomNumber}*: Boh... 🙄`;
        }
      })
      .join('\n');
  }


  private static replyErr(command: string, err: any, reply: ContextMessageUpdate['reply']) {
    this.printErr(command, err);
    reply(`Sorry, I have no time to check all rooms... Try to knock on every door...`);
  }

  private static printErr(command: string, err: any) {
    console.error(chalk.default.bold.red(`> Error while replying to command '${command}':`), err);
  }


  // Middlewares //////////////////////////////////////////////////////////////////////////////

  private static async presidentMiddleware({from, reply}: ContextMessageUpdate, next: () => any) {
    if (from && from.username === PRESIDENT_USERNAME) {
      await reply('PovoPresident! 😮');
    }
    return next();
  }

  private static async vicePresidentMiddleware({from, reply}: ContextMessageUpdate, next: () => any) {
    if (from && from.username === VICEPRESIDENT_USERNAME) {

      if (this.VP_COUNTER >= 3) {
        setTimeout(() => {
          this.VP_COUNTER = 0;
        }, 60000);

        await reply('PovoVicePresident 😠 non ti sembra di fare un pò troppe richieste?');
      } else {
        this.VP_COUNTER++;
        await reply('PovoVicePresident 😒 per questa volta ti rispondo...');
        return next();
      }
    } else {
      return next();
    }
  }

  private static async willyMiddleware({from, reply}: ContextMessageUpdate, next: () => any) {
    if (from && ((from.username === 'principato') || from.first_name === 'Williams')) {
      await reply('I don\'t talk with you Willy 😑...');
    } else {
      return next();
    }
  }

}
