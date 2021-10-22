import { Controller, Get, Logger } from '@nestjs/common';

@Controller('')
export class MainController {
  constructor(private readonly logger: Logger) {}

  @Get(['/health', ''])
  async health(): Promise<any> {
    return {
      message: 'ok v1.0003'
    };
  }
}
