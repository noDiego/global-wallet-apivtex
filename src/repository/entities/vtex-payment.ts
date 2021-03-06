import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { VtexTransactionFlow } from './vtex-transaction-flow';
import { VtexWalletPayment } from './vtex-wallet-payment';
import { Commerce } from './commerce.entity';

@Entity()
export class VtexPayment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ nullable: false, unique: true })
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

  @Column({ nullable: true, unique: true })
  reference: string;

  @Column({ nullable: true, unique: false })
  authorizationId: string;

  @Column({ nullable: true, unique: false })
  merchantName: string;

  @Column({ nullable: true, unique: false })
  commerceId: number;

  @ManyToOne(() => Commerce, (c) => c.id)
  @JoinColumn()
  commerce: Commerce;

  @Column({ nullable: true, unique: false })
  clientEmail: string;

  @Column({ nullable: true, unique: false })
  callbackUrl: string;

  @OneToMany(() => VtexTransactionFlow, (transaction: VtexTransactionFlow) => transaction.payment)
  transactions: VtexTransactionFlow[];

  @OneToMany(() => VtexWalletPayment, (walletPayment: VtexWalletPayment) => walletPayment.payment)
  walletPayments: VtexWalletPayment[];
}
