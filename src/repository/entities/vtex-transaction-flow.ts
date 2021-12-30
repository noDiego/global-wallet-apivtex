import { BaseEntity, Column, Entity, Generated, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentOperation } from '../../interfaces/enums/vtex.enum';

@Entity()
export class VtexTransactionFlow extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: Date;

  @Column({ nullable: false, unique: false })
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
