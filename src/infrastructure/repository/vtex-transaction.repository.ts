import { EntityRepository, Repository } from 'typeorm';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { PaymentOperation, TransactionStatus } from '../enums/vtex.enum';
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
    operation: PaymentOperation,
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
    vtexTransaction.status = operation == PaymentOperation.PAYMENT ? TransactionStatus.INIT : undefined;

    vtexTransaction.coreId = trx && trx.id ? String(trx.id) : null;
    vtexTransaction.authorizationId = trx ? trx.authorizationCode : null;
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

  async getPayment(paymentId: string, operationType?: PaymentOperation): Promise<VtexTransactionDto> {
    const transaction: VtexTransaction = await this.findOne({
      where: {
        paymentId: paymentId,
        operationType: operationType ? operationType : PaymentOperation.PAYMENT,
      },
    });
    return plainToClass(VtexTransactionDto, transaction);
  }

  async updatePaymentStatus(paymentId: string, status: TransactionStatus): Promise<boolean> {
    try {
      await this.update(
        {
          paymentId: paymentId,
          operationType: PaymentOperation.PAYMENT,
        },
        { status: status },
      );
      return true;
    } catch (e) {
      this.logger.error('Error al actualizar status: ' + e.message);
      return false;
    }
  }
}
