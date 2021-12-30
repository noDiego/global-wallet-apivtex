import { BaseEntity, Column, Entity, Generated, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentOperation } from '../../interfaces/enums/vtex.enum';
import { VtexTransactionFlow } from './vtex-transaction-flow';

@Entity()
export class VtexPayment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: Date;

  @Column({ nullable: false, unique: false })
  paymentId: string;

  @Column({ nullable: true })
  status: string;

  @Column()
  amount: number;

  @Column()
  originalAmount: number;

  @Column({ nullable: true, unique: false })
  orderId: string;

  @Column({ nullable: true, unique: false })
  coreId: string;

  @Column({ nullable: true, unique: false })
  authorizationId: string;

  @Column({ nullable: true, unique: false })
  merchantName: string;

  @Column({ nullable: true, unique: false })
  clientEmail: string;

  @Column({ nullable: true, unique: false })
  callbackUrl: string;

  @OneToMany(() => VtexTransactionFlow, (transfer: VtexTransactionFlow) => transfer.paymentId)
  transactions: VtexTransactionFlow[];
}
