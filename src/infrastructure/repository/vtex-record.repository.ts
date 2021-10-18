import { EntityRepository, getRepository, Repository } from "typeorm";
import { InternalServerErrorException, Logger } from "@nestjs/common";
import { VtexRecord } from "../../domain/entities/vtex.record";
import { plainToClass } from "class-transformer";
import { VtexRecordDto } from "../dto/vtex-record.dto";
import { PaymentFlow } from "../enums/vtex.enum";

@EntityRepository(VtexRecord)
export class VtexRecordRepository extends Repository<VtexRecord> {
  private logger = new Logger('TransactionRepository');

  async createRecord(
    paymentId: string,
    flowStep: PaymentFlow,
    vtexRequest: any,
  ): Promise<VtexRecordDto> {
    const record: VtexRecord = new VtexRecord();
    record.paymentId= paymentId;
    record.flowStep=flowStep;
    record.requestData=vtexRequest;
    record.date=new Date();
    try {
      const recordSaved = await record.save();
      return plainToClass(VtexRecordDto, recordSaved);
    } catch (e) {
      this.logger.error(
        `Error al crear VtexRecord, Data: ${JSON.stringify(
            vtexRequest,
        )}`,
        e.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
