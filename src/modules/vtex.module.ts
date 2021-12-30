import { VtexController } from '../controllers/vtex.controller';
import { VtexService } from '../services/vtex.service';
import { Module } from '@nestjs/common';
import { WalletApiClient } from '../client/wallet-api.client';
import { VtexRecordRepository } from '../repository/vtex-record.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VtexPaymentRepository } from '../repository/vtex-payment.repository';
import { VtexTransactionFlowRepository } from '../repository/vtex-transaction-flow.repository';

@Module({
  imports: [TypeOrmModule.forFeature([VtexRecordRepository, VtexPaymentRepository, VtexTransactionFlowRepository])],
  controllers: [VtexController],
  providers: [VtexService, WalletApiClient],
})
export class VtexModule {}
