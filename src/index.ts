import {Telegraf as Tg, ContextMessageUpdate} from 'telegraf/typings';
import {Config} from './config';
import {BotSetup} from './bot-setup';

import * as Telegraf from 'telegraf';
import * as chalk from 'chalk';


// //////////////////////////////////////////////////
//  Init
// //////////////////////////////////////////////////

// Load config and Ports
const config = Config.instance();

// Create bot
const bot: Tg<ContextMessageUpdate> = new Telegraf<ContextMessageUpdate>(config.getBotToken());
// Setup the bot commands & co
BotSetup.setupBot(bot);


// //////////////////////////////////////////////////
//  Start bot
// //////////////////////////////////////////////////

// Polling mode
console.log(chalk.default.green('> Starting Bot...'));
bot.startPolling();
bot.startWebhook(config.getWebHookPath(), null as any, config.getPort());
console.log(chalk.default.bold.green('> Bot started!'));
