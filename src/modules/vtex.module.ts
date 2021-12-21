import { VtexController } from '../controllers/vtex.controller';
import { VtexService } from '../services/vtex.service';
import { Module } from '@nestjs/common';
import { WalletApiClient } from '../client/wallet-api.client';
import { VtexRecordRepository } from '../repository/vtex-record.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VtexTransactionRepository } from '../repository/vtex-transaction.repository';
import { VtexDefaultService } from '../services/vtex-default.service';
import { VtexDefaultController } from '../controllers/vtex-default.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VtexRecordRepository, VtexTransactionRepository])],
  controllers: [VtexController, VtexDefaultController],
  providers: [VtexService, VtexDefaultService, WalletApiClient],
})
export class VtexModule {}
