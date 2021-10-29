import {
  BaseEntity,
  Column,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentOperation } from '../../infrastructure/enums/vtex.enum';

@Entity()
export class VtexTransaction extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, unique: false })
  transactionNumber: string;

  @Column({ nullable: false, unique: false })
  paymentId: string;

  @Column({ nullable: false })
  operationType: PaymentOperation;

  @Column()
  amount: number;

  @Column({ nullable: true, unique: false })
  orderId: string;

  @Column({ nullable: true, unique: false })
  idCore: string;

  @Column({ nullable: true, unique: false })
  authorizationId: string;

  @Column({ nullable: true, unique: false })
  settleId: string;

  @Column({ nullable: true, unique: false })
  requestId: string;

  @Column({ nullable: true, unique: false })
  merchantName: string;

  @Column({ nullable: true, unique: false })
  clientEmail: string;

  @Column({ nullable: true, unique: false })
  callbackUrl: string;

  @Column()
  date: Date;

  @Column()
  status: string;
}
