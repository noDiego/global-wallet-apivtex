import { Controller, Get, Logger } from '@nestjs/common';
import { envConfig } from '../../config';
import { RequestHeader } from '../dto/request-header.decorator';
import { HeadersDTO } from '../dto/headers.dto';

@Controller('')
export class MainController {
  constructor(private readonly logger: Logger) {}

  @Get(['/health', ''])
  async health(): Promise<any> {
    return {
      message: 'ok v1.0011',
    };
  }

  @Get(['/testData'])
  async test(@RequestHeader(HeadersDTO) headers): Promise<any> {
    return {
      envConfig,
      envTest: process.env.NAMESPACE,
    };
  }
}
