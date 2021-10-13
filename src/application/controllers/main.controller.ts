import { Controller, Get, Logger } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('')
@ApiExcludeController()
export class MainController {
  constructor(private readonly logger: Logger) {}

  @Get('/health')
  async health(): Promise<string> {
    return 'funcionando';
  }
}
