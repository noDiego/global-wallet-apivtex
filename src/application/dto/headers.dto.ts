import { IsDefined, IsString } from "class-validator";
import { Expose } from "class-transformer";

export class HeadersDTO {
    // @IsString()
    // @IsDefined()
    // @Expose({ name: 'x-consumer-username' })        // required as headers are case insensitive
    // username: string;

    @IsString()
    @IsDefined()
    @Expose({ name: 'x-vtex-api-appkey' })
    appKey: string;

    @IsString()
    @IsDefined()
    @Expose({ name: 'x-vtex-api-apptoken' })
    apptoken: string;
}
