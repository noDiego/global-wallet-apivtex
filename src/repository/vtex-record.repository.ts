import { EntityRepository, Repository } from 'typeorm';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { VtexRecord } from './entities/vtex.record';
import { VtexRecordDto } from '../interfaces/dto/vtex-record.dto';

@EntityRepository(VtexRecord)
export class VtexRecordRepository extends Repository<VtexRecord> {
  private logger = new Logger('VtexRecordRepository');

  createRecord(recordInput: VtexRecordDto): void {
    const record: VtexRecord = new VtexRecord();
    record.paymentId = recordInput.paymentId;
    record.operationType = recordInput.operationType;
    record.requestData = recordInput.requestData;
    record.responseData = recordInput.responseData;
    record.date = new Date();
    try {
      record
        .save()
        .then(() =>
          this.logger.log(
            `PaymentId:${recordInput.paymentId} | Creacion de VtexRecord, ${recordInput.operationType} - OK`,
          ),
        );
    } catch (e) {
      this.logger.error(
        `PaymentId:${recordInput.paymentId} | Error creando VtexRecord, Data: ${JSON.stringify(recordInput)}`,
        e.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
