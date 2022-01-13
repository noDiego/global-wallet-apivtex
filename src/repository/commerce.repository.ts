import { EntityRepository, Repository } from 'typeorm';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { Commerce } from './entities/commerce.entity';
import { CommerceDto } from '../interfaces/dto/commerce.dto';
import { plainToClass } from 'class-transformer';

@EntityRepository(Commerce)
export class CommerceRepository extends Repository<Commerce> {
  private logger = new Logger('VtexWalletPaymentRepository');

  async getCommerceByToken(commerceToken: string): Promise<CommerceDto> {
    const commerce: Commerce = await this.findOne({ token: commerceToken });
    if (!commerce) {
      this.logger.error(`Token: ${commerceToken} doesn't exist`);
      throw new InternalServerErrorException(`Token: ${commerceToken} doesn't exist`);
    }
    return plainToClass(CommerceDto, commerce);
  }
}
