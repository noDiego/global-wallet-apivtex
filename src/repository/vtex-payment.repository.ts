import { EntityRepository, Repository } from 'typeorm';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { PaymentStatus } from '../interfaces/enums/vtex.enum';
import { VtexPayment } from './entities/vtex-payment';
import { PaymentDto } from '../interfaces/dto/payment.dto';
import { UpdatePaymentDto } from '../interfaces/dto/update-payment.dto';
import { cleanObject } from '../utils/validation';

@EntityRepository(VtexPayment)
export class VtexPaymentRepository extends Repository<VtexPayment> {
  private logger = new Logger('VtexPaymentRepository');

  async createInitPayment(data: PaymentDto, rejected = false): Promise<PaymentDto> {
    const payment: VtexPayment = new VtexPayment();
    payment.paymentId = data.paymentId;
    payment.orderId = data.orderId;
    payment.amount = data.amount;
    payment.originalAmount = data.amount;
    payment.callbackUrl = data.callbackUrl;
    payment.merchantName = data.merchantName;
    payment.clientEmail = data.clientEmail;
    payment.status = data.status ? data.status : PaymentStatus.INIT;

    payment.date = new Date();
    try {
      const paymentSaved = await payment.save();
      return plainToClass(PaymentDto, paymentSaved);
    } catch (e) {
      this.logger.error(
        `Error al crear Payment, Data: ${JSON.stringify({
          vtexData: data,
        })} - Error:${e.message}`,
        e.stack,
      );
      throw new InternalServerErrorException(e);
    }
  }

  async getPayment(paymentId: string): Promise<PaymentDto> {
    const payment: VtexPayment = await this.findOne({
      where: {
        paymentId: paymentId,
      },
      relations: ['walletPayments'],
    });
    return plainToClass(PaymentDto, payment);
  }

  async updatePayment({ amount, paymentId, status }: UpdatePaymentDto): Promise<boolean> {
    const updateData = {
      status: status,
      amount: amount,
    };

    try {
      await this.update(
        {
          paymentId: paymentId,
        },
        cleanObject(updateData),
      );
      return true;
    } catch (e) {
      this.logger.error('Error al actualizar status de Payment: ' + e.message + ' PayId: ' + paymentId);
      return false;
    }
  }
  // /*
  // Se obtiene valor final luego de upselling/downselling
  //  */
  // async getPaymentTotalAmount(paymentId: string): Promise<number> {
  //   try {
  //     const payment: VtexPayment = await this.findOne({ where: { paymentId: paymentId }, relations: ['transactions'] });
  //     let sum = payment.amount;
  //     payment.transactions.forEach((tx) => {
  //       if (tx.operationType == PaymentOperation.REFUND) {
  //         sum = sum - tx.amount;
  //       }
  //     });
  //     return sum;
  //   } catch (e) {
  //     this.logger.error('Error al actualizar status: ' + e.message);
  //     throw e;
  //   }
  // }
}
