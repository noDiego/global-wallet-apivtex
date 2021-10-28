import { EntityRepository, Repository } from 'typeorm';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { PaymentFlow } from '../enums/vtex.enum';
import { VtexTransaction } from '../../domain/entities/vtex-transaction';
import { VtexTransactionDto } from '../dto/vtex-transaction.dto';
import { CoreTransactionDto } from '../dto/core-transaction.dto';
import { VtexRequestDto } from '../../application/dto/vtex-request.dto';

@EntityRepository(VtexTransaction)
export class VtexTransactionRepository extends Repository<VtexTransaction> {
  private logger = new Logger('VtexTransactionRepository');

  async saveTransaction(
    vtexData: VtexRequestDto,
    trx: CoreTransactionDto,
    operation: PaymentFlow,
  ): Promise<VtexTransactionDto> {
    const vtexTransaction: VtexTransaction = new VtexTransaction();
    vtexTransaction.paymentId = vtexData.paymentId;
    vtexTransaction.orderId = vtexData.orderId;
    vtexTransaction.requestId = vtexData.requestId;
    vtexTransaction.settleId = vtexData.settleId;
    vtexTransaction.amount = vtexData.value;
    vtexTransaction.callbackUrl = vtexData.callbackUrl;
    vtexTransaction.merchantName = vtexData.merchantName;
    vtexTransaction.clientEmail = vtexData.clientEmail;
    vtexTransaction.transactionNumber = vtexData.transactionNumber;

    vtexTransaction.idCore = trx.id?String(trx.id):null;
    vtexTransaction.authorizationId = trx.authorizationCode;
    vtexTransaction.date = new Date();
    vtexTransaction.operationType = operation;
    try {
      const trxSaved = await vtexTransaction.save();
      const trxDto = plainToClass(VtexTransactionDto, trxSaved);
      delete trxDto.id;
      return trxDto;
    } catch (e) {
      this.logger.error(
        `Error al crear VtexRecord, Data: ${JSON.stringify({
          vtexData,
          trx,
        })}`,
        e.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async getPayment(paymentId: string): Promise<VtexTransactionDto> {
    const transaction: VtexTransaction = await this.findOne({
      where: { paymentId: paymentId, operationType: PaymentFlow.PAYMENT },
    });
    return plainToClass(VtexTransactionDto, transaction);
  }
}
