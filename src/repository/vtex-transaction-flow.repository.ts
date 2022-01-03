import { EntityRepository, getRepository, Repository } from 'typeorm';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { PaymentOperation } from '../interfaces/enums/vtex.enum';
import { PaymentTransactionDto } from '../interfaces/dto/payment-transaction.dto';
import { VtexTransactionFlow } from './entities/vtex-transaction-flow';
import { VtexPayment } from './entities/vtex-payment';

@EntityRepository(VtexTransactionFlow)
export class VtexTransactionFlowRepository extends Repository<VtexTransactionFlow> {
  private logger = new Logger('VtexTransactionFlowRepository');

  async saveTransaction(transactionsData: PaymentTransactionDto): Promise<PaymentTransactionDto> {
    const transaction: VtexTransactionFlow = new VtexTransactionFlow();
    transaction.payment = await getRepository(VtexPayment).findOne(transactionsData.paymentId);
    transaction.requestId = transactionsData.requestId;
    transaction.settleId = transactionsData.settleId;
    transaction.amount = transactionsData.amount;
    transaction.authorizationId = transactionsData?.authorizationId;
    transaction.date = transactionsData.date ? transactionsData.date : new Date();
    transaction.operationType = transactionsData.operationType;
    try {
      const trxSaved = await transaction.save();
      const trxDto = plainToClass(PaymentTransactionDto, trxSaved);
      delete trxDto.id;
      return trxDto;
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
