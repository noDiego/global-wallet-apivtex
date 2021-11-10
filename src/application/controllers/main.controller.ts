import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { envConfig } from '../../config';

@Controller('')
export class MainController {
  constructor(private readonly logger: Logger) {}

  @Get(['/health', ''])
  async health(): Promise<any> {
    return {
      message: 'ok',
    };
  }

  @Post(['/health'])
  async healthEnv(@Body() { test: string }): Promise<any> {
    return {
      message: 'ok',
      envConfig,
    };
  }
}
