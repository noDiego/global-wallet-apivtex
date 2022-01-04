import { EntityRepository, Repository } from 'typeorm';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { VtexWalletPayment } from './entities/vtex-wallet-payment';
import { WalletPaymentDto } from '../interfaces/dto/wallet-payment.dto';

@EntityRepository(VtexWalletPayment)
export class VtexWalletPaymentRepository extends Repository<VtexWalletPayment> {
  private logger = new Logger('VtexWalletPaymentRepository');

  savePayment(data: WalletPaymentDto): void {
    const walletPay: VtexWalletPayment = new VtexWalletPayment();
    walletPay.paymentId = data.paymentId;
    walletPay.amount = data.amount;
    walletPay.operationType = data.operationType;
    walletPay.coreId = data.coreId;
    walletPay.date = new Date();

    try {
      walletPay
        .save()
        .then((r) =>
          this.logger.log(`WalletPayment paymentId:${data.paymentId}, coreId:${data.coreId} - Saved successful`),
        );
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

  updateWalletPayment(coreId: string, newAmount: number) {
    this.update(coreId, { amount: newAmount }).then(() => {
      this.logger.log(`UpdateWalletPayment - coreId:${coreId} - OK`);
    });
  }
}
