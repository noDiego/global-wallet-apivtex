import { Controller, Get, Logger } from '@nestjs/common';
import { envConfig } from '../../config';

@Controller('')
export class MainController {
  constructor(private readonly logger: Logger) {}

  @Get(['/health', ''])
  async health(): Promise<any> {
    return {
      message: 'ok v1.0011'
    };
  }

  @Get(['/testData'])
  async test(): Promise<any> {
    return {
      envConfig,
      envTest: process.env.NAMESPACE
    };
  }
}
