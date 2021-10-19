import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { PaymentFlow } from "../../infrastructure/enums/vtex.enum";

@Entity()
export class VtexRecord extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ nullable: false, unique: false })
    paymentId: string;
    @Column({ nullable: false })
    flowStep: PaymentFlow;
    @Column({ nullable: false, type: "json" })
    requestData: any;
    @Column({ nullable: false, type: "json" })
    responseData: any;
    @Column({nullable: false})
    date: Date;
}
