import { InternalServerErrorException, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { envConfig } from '../../config';
import { ResponseDTO } from '../dto/wallet-response.dto';
import { CommerceClientDTO } from '../dto/commerceClient.dto';
import { URLS } from '../../constants/urls';
import { CreatePaymentReq } from '../dto/createPaymentReq.dto';
import { CreateTransactionReq } from '../dto/createTransactionReq.dto';
import { TransactionDto } from '../dto/transaction.dto';

export class WalletApiClient {
  private logger = new Logger('BankferClient');

  public async payment(
    data: CreateTransactionReq,
    origin: string,
  ): Promise<CommerceClientDTO> {
    // (como id puede venir el commerceUserId, userDni, emailUser, userId)
    const headers: any = {
      'x-api-key': envConfig,
    };
    const url = URLS.bankfer.accountsByUser + '/' + id;

    const requestConfig: AxiosRequestConfig = {
      method: 'POST',
      headers: headers,
      url: url,
    };
    this.logger.debug('URL:' + url);
    try {
      const response: AxiosResponse<ResponseDTO<CommerceClientDTO>> =
        await axios(requestConfig);
      if (response.data) {
        const resp: ResponseDTO<CommerceClientDTO> = response.data;
        return resp.data;
      }
    } catch (e) {
      this.logger.error(
        `Error al conectar con api wallet para payment, Data: ${JSON.stringify(
          id,
        )}`,
        e.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  public async cancel(paymentId: string): Promise<TransactionDto> {
    const headers: any = {
      'x-api-key': envConfig,
    };
    const url = URLS.bankfer.accountsByUser;

    const requestConfig: AxiosRequestConfig = {
      method: 'DELETE',
      headers: headers,
      url: url,
      params: { id: paymentId },
    };
    this.logger.debug('URL:' + url);
    try {
      const response: AxiosResponse<ResponseDTO<TransactionDto>> = await axios(
        requestConfig,
      );
      if (response.data) {
        const resp: ResponseDTO<TransactionDto> = response.data;
        return resp.data;
      }
    } catch (e) {
      this.logger.error(
        `Error al conectar con api wallet para payment, Data: ${JSON.stringify(
          paymentId,
        )}`,
        e.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
