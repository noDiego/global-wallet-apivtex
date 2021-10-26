import { EntityRepository, getRepository, Repository } from "typeorm";
import { InternalServerErrorException, Logger } from "@nestjs/common";
import { VtexRecord } from "../../domain/entities/vtex.record";
import { plainToClass } from "class-transformer";
import { VtexRecordDto } from "../dto/vtex-record.dto";
import { PaymentFlow } from "../enums/vtex.enum";
import { VtexTransaction } from "../../domain/entities/vtex-transaction";
import { VtexTransactionDto } from "../dto/vtex-transaction.dto";
import { CoreTransactionDto } from "../dto/core-transaction.dto";
import { VtexRequestDto } from "../../application/dto/vtex-request.dto";

@EntityRepository(VtexTransaction)
export class VtexTransactionRepository extends Repository<VtexTransaction> {
    private logger = new Logger('VtexTransactionRepository');

    async createTransaction(
        vtexData: VtexRequestDto,
        trx: CoreTransactionDto,
        operation: PaymentFlow
    ): Promise<VtexTransactionDto> {
        const vtexTransaction: VtexTransaction = new VtexTransaction();
        vtexTransaction.paymentId = vtexData.paymentId;
        vtexTransaction.orderId = vtexData.orderId;
        vtexTransaction.requestId = vtexData.requestId;
        vtexTransaction.settleId = vtexData.settleId;
        vtexTransaction.amount = vtexData.value;

        vtexTransaction.idCore = String(trx.id);
        vtexTransaction.authorizationId = trx.authorizationCode;
        vtexTransaction.date = new Date();
        vtexTransaction.operationType = operation;
        try {
            const trxSaved = await vtexTransaction.save();
            const trxDto = plainToClass(VtexTransactionDto, trxSaved);
            delete trxDto.id;
            return trxDto;
        } catch (e) {
            this.logger.error(
                `Error al crear VtexRecord, Data: ${JSON.stringify({
                        vtexData, trx,
                    }
                )}`,
                e.stack,
            );
            throw new InternalServerErrorException();
        }
    }

    async getTransaction(paymentId: string){
        return await this.findOne({where: { paymentId: paymentId, operationType: PaymentFlow.PAYMENT}});
    }
}
