import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { HeadersDTO } from '../dto/headers.dto';

@Injectable()
export class CustomValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type == 'param') return value;
    const object = plainToClass(metadata.metatype, value);
    const isHeader = object instanceof HeadersDTO;
    const errors = await validate(isHeader ? value : object);
    if (errors.length > 0) {
      if (isHeader) throw new UnauthorizedException(`Invalid authentication credentials`);
      throw new BadRequestException(`Validation Failed: [${this.formatErrors(errors)}]`);
    }
    return value;
  }

  private formatErrors(errors: any[]) {
    return errors
      .map((error) => {
        for (const key in error.constraints) {
          return `'${error.constraints[key]}'`;
        }
      })
      .join(', ');
  }
}
