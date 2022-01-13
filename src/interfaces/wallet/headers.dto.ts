import { Contains, IsDefined, IsString, Length } from 'class-validator';
import { Expose } from 'class-transformer';
import { envConfig } from '../../config';

const appkeyLenght = envConfig.server.vtexAppKey.length;

export class HeadersDTO {
  @IsString()
  @Length(appkeyLenght, appkeyLenght)
  @Expose({ name: 'x-vtex-api-appkey' })
  @Contains(envConfig.server.vtexAppKey)
  appkey: string;

  // @IsString()
  // @IsDefined()
  // @Expose({ name: 'x-vtex-api-apptoken' })
  // @Contains(envConfig.server.vtexApiToken)
  // apptoken: string;
}

export class HeadersSessionDTO extends HeadersDTO {
  @IsString()
  @IsDefined()
  @Expose({ name: 'cookie' })
  cookie: string;
}

export class ConfirmationHeaders {
  @IsString()
  @IsDefined()
  @Expose({ name: 'x-api-token' })
  xapitoken: string;

  @IsString()
  @IsDefined()
  @Expose({ name: 'x-api-session' })
  xapisession: string;
}
