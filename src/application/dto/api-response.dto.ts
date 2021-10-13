import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';

export class ResponseDTO<T> {
  @ApiModelProperty({ description: '0:OK - 1: NO DATA - 2: Error' })
  code: number; //0 ok; 1 error
  @ApiModelProperty()
  message: string;
  @ApiModelProperty()
  data?: T;
}

export class PaginatedResponseDTO<T> {
  @ApiModelProperty()
  code: number; //0 ok; 1 error
  @ApiModelProperty()
  message: string;
  @ApiModelProperty()
  data?: T;
  @ApiModelProperty()
  page?: number;
  @ApiModelProperty()
  limit?: number;
  @ApiModelProperty()
  totalPage?: number;
  @ApiModelProperty()
  recordTotal?: number;
}
