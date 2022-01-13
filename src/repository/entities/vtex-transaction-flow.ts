import { BaseEntity, Column, Entity, Generated, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentOperation } from '../../interfaces/enums/vtex.enum';
import { VtexPayment } from './vtex-payment';

@Entity()
export class VtexTransactionFlow extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: Date;

  @ManyToOne(() => VtexPayment, (payment) => payment.transactions, {
    cascade: ['insert', 'update'],
  })
  @JoinColumn({ name: 'paymentId', referencedColumnName: 'paymentId' })
  payment: VtexPayment;

  @Column()
  paymentId: string;

  @Column({ nullable: false })
  operationType: PaymentOperation;

  @Column()
  amount: number;

  @Column({ nullable: true, unique: false })
  authorizationId: string;

  @Column({ nullable: true, unique: false })
  settleId: string;

  @Column({ nullable: true, unique: false })
  requestId: string;
}
