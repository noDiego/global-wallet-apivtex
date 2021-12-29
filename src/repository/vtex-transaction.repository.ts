import { EntityRepository, Repository } from 'typeorm';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { PaymentOperation, VtexTransactionStatus } from '../interfaces/enums/vtex.enum';
import { VtexTransaction } from './entities/vtex-transaction';
import { VtexTransactionDto } from '../interfaces/dto/vtex-transaction.dto';
import { VtexRequestDto } from '../interfaces/wallet/vtex-request.dto';
import { CoreTransactionRes } from '../interfaces/dto/core-transaction.dto';

@EntityRepository(VtexTransaction)
export class VtexTransactionRepository extends Repository<VtexTransaction> {
  private logger = new Logger('VtexTransactionRepository');

  async saveTransaction(
    vtexRequest: VtexRequestDto,
    operation: PaymentOperation,
    trx?: CoreTransactionRes | any,
    rejected = false,
  ): Promise<VtexTransactionDto> {
    const vtexTransaction: VtexTransaction = new VtexTransaction();
    vtexTransaction.paymentId = vtexRequest.paymentId;
    vtexTransaction.orderId = vtexRequest.orderId;
    vtexTransaction.requestId = vtexRequest.requestId;
    vtexTransaction.settleId = vtexRequest.settleId;
    vtexTransaction.amount = vtexRequest.value | trx?.amount;
    vtexTransaction.callbackUrl = vtexRequest.callbackUrl;
    vtexTransaction.merchantName = vtexRequest.merchantName;
    vtexTransaction.clientEmail = vtexRequest.clientEmail;
    vtexTransaction.transactionNumber = vtexRequest.transactionNumber;
    vtexTransaction.status =
      operation == PaymentOperation.PAYMENT
        ? rejected
          ? VtexTransactionStatus.REJECTED
          : VtexTransactionStatus.INIT
        : undefined;

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
        `Error al crear VtexTransaction, Data: ${JSON.stringify({
          vtexData: vtexRequest,
          trx,
        })} - Error:${e.message}`,
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

  async updatePaymentStatus(paymentId: string, status: VtexTransactionStatus): Promise<boolean> {
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
  /*
  Se obtiene valor final luego de upselling/downselling
   */
  async getPaymentTotalAmount(paymentId: string): Promise<number> {
    try {
      let sum = 0;
      const transactionList = await this.find({ where: { paymentId: paymentId } });
      transactionList.forEach((tx) => {
        if (tx.operationType == PaymentOperation.REFUND) {
          sum = sum - tx.amount;
        } else if (tx.operationType == PaymentOperation.PAYMENT) {
          sum = sum + tx.amount;
        }
      });
      return sum;
    } catch (e) {
      this.logger.error('Error al actualizar status: ' + e.message);
      throw e;
    }
  }
}
