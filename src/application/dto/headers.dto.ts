import { Contains, IsDefined, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { envConfig } from '../../config';

export class HeadersDTO {
  // @IsString()
  // @IsDefined()
  // @Expose({ name: 'x-consumer-username' })        // required as headers are case insensitive
  // username: string;

  @IsString()
  @IsDefined()
  @Expose({ name: 'x-vtex-api-appkey' })
  @Contains(envConfig.server.vtexAppKey)
  appKey: string;

  // @IsString()
  // @IsDefined()
  // @Expose({ name: 'x-vtex-api-apptoken' })
  // @Contains(envConfig.server.vtexApiToken)
  // apptoken: string;
}
