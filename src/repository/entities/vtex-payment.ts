import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { VtexTransactionFlow } from './vtex-transaction-flow';
import { VtexWalletPayment } from './vtex-wallet-payment';

@Entity()
export class VtexPayment extends BaseEntity {
  @PrimaryColumn()
  paymentId: string;

  @Column()
  date: Date;

  @Column({ nullable: true })
  status: string;

  @Column()
  amount: number;

  @Column()
  originalAmount: number;

  @Column({ nullable: true, unique: false })
  orderId: string;

  @Column({ nullable: true, unique: false })
  authorizationId: string;

  @Column({ nullable: true, unique: false })
  merchantName: string;

  @Column({ nullable: true, unique: false })
  clientEmail: string;

  @Column({ nullable: true, unique: false })
  callbackUrl: string;

  @OneToMany(() => VtexTransactionFlow, (transaction: VtexTransactionFlow) => transaction.payment)
  transactions: VtexTransactionFlow[];

  @OneToMany(() => VtexWalletPayment, (walletPayment: VtexWalletPayment) => walletPayment.payment)
  walletPayments: VtexWalletPayment[];
}
