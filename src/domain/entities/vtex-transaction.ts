import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { PaymentFlow } from "../../infrastructure/enums/vtex.enum";

@Entity()
export class VtexTransaction extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false, unique: false })
    paymentId: string;

    @Column({ nullable: false })
    operationType: PaymentFlow;

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

    @Column()
    date: Date;
}
