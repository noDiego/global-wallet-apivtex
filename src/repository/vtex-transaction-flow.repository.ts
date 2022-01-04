import { EntityRepository, Repository } from 'typeorm';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { PaymentTransactionDto } from '../interfaces/dto/payment-transaction.dto';
import { VtexTransactionFlow } from './entities/vtex-transaction-flow';

@EntityRepository(VtexTransactionFlow)
export class VtexTransactionFlowRepository extends Repository<VtexTransactionFlow> {
  private logger = new Logger('VtexTransactionFlowRepository');

  saveTransaction(transactionsData: PaymentTransactionDto): void {
    const transaction: VtexTransactionFlow = new VtexTransactionFlow();
    transaction.paymentId = transactionsData.paymentId;
    transaction.requestId = transactionsData.requestId;
    transaction.settleId = transactionsData.settleId;
    transaction.amount = transactionsData.amount;
    transaction.authorizationId = transactionsData?.authorizationId;
    transaction.date = transactionsData.date || new Date();
    transaction.operationType = transactionsData.operationType;
    try {
      transaction
        .save()
        .then(() =>
          this.logger.log(`Transaction paymentId:${transactionsData.paymentId}, ${transaction.operationType} - OK`),
        );
    } catch (e) {
      this.logger.error(
        `Error al crear VtexTransaction, Data: ${JSON.stringify({
          vtexData: transactionsData,
        })} - Error:${e.message}`,
        e.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
