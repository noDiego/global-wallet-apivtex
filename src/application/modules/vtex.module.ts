import { VtexController } from '../controllers/vtex.controller';
import { VtexService } from '../../domain/services/vtex.service';
import { Module } from '@nestjs/common';
import { WalletApiClient } from '../../infrastructure/client/wallet-api.client';
import { VtexRecordRepository } from '../../infrastructure/repository/vtex-record.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VtexTransactionRepository } from '../../infrastructure/repository/vtex-transaction.repository';
import { VtexDefaultService } from '../../domain/services/vtex-default.service';
import { VtexDefaultController } from '../controllers/vtex-default.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VtexRecordRepository, VtexTransactionRepository])],
  controllers: [VtexController, VtexDefaultController],
  providers: [VtexService, VtexDefaultService, WalletApiClient],
})
export class VtexModule {}
