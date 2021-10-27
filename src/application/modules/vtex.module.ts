import { VtexController } from '../controllers/vtex.controller';
import { VtexService } from '../../domain/services/vtex.service';
import { Module } from '@nestjs/common';
import { WalletApiClient } from '../../infrastructure/client/wallet-api.client';
import { VtexRecordRepository } from '../../infrastructure/repository/vtex-record.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VtexTransactionRepository } from '../../infrastructure/repository/vtex-transaction.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([VtexRecordRepository, VtexTransactionRepository]),
  ],
  controllers: [VtexController],
  providers: [VtexService, WalletApiClient],
})
export class VtexModule {}
