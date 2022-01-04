import { EntityRepository, getRepository, Repository } from 'typeorm';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { VtexWalletPayment } from './entities/vtex-wallet-payment';
import { WalletPaymentDto } from '../interfaces/dto/wallet-payment.dto';
import { VtexPayment } from './entities/vtex-payment';

@EntityRepository(VtexWalletPayment)
export class VtexWalletPaymentRepository extends Repository<VtexWalletPayment> {
  private logger = new Logger('VtexWalletPaymentRepository');

  async savePayment(data: WalletPaymentDto): Promise<WalletPaymentDto> {
    const walletPay: VtexWalletPayment = new VtexWalletPayment();
    walletPay.paymentId = data.paymentId;
    walletPay.amount = data.amount;
    walletPay.operationType = data.operationType;
    walletPay.coreId = data.coreId;
    walletPay.date = new Date();

    try {
      const paymentSaved = await walletPay.save();
      return plainToClass(WalletPaymentDto, paymentSaved);
    } catch (e) {
      this.logger.error(
        `Error al crear Wallet Payment, Data: ${JSON.stringify({
          data: data,
        })} - Error:${e.message}`,
        e.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async updateWalletPayment(coreId: string, newAmount: number): Promise<void> {
    await this.update(coreId, { amount: newAmount });
  }
}
