import * as chalk from 'chalk';

export class Config {

  private static config: Config;

  private readonly ENV_BOT_TOKEN = 'BOT_TOKEN';
  private readonly ENV_PORT = 'PORT';

  private readonly botToken: string;
  private readonly port: string;

  static instance(): Config {
    if (!this.config) {
      this.config = new Config();
    }
    return this.config;
  }

  private constructor() {

    this.botToken = process.env[this.ENV_BOT_TOKEN] || '';
    this.port = process.env[this.ENV_PORT] || '';

    if (!this.botToken) {
      console.warn(chalk.default.bold.red(`> Missing env var ${this.ENV_BOT_TOKEN}`));
      process.exit(-1);
    }

  }



  getBotToken(): string {
    return this.botToken;
  }

  getPort(): string {
    return this.port;
  }

}
