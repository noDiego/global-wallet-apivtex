import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { PaymentOperation } from '../../interfaces/enums/vtex.enum';
import { VtexPayment } from './vtex-payment';

@Entity()
export class VtexWalletPayment extends BaseEntity {
  @PrimaryColumn()
  coreId: string;

  @Column()
  date: Date;

  @ManyToOne(() => VtexPayment, (payment) => payment.walletPayments, {
    cascade: ['insert', 'update'],
  })
  @JoinColumn({ name: 'paymentId', referencedColumnName: 'paymentId' })
  payment: VtexPayment;

  @Column()
  paymentId: string;

  @Column()
  amount: number;

  @Column({ nullable: false })
  operationType: PaymentOperation;
}
