import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { envConfig } from '../../config';
import { ResponseDTO } from '../dto/wallet-response.dto';
import { URLS } from '../../constants/urls';
import { CreateTransactionDetail } from '../dto/create-transaction-req.dto';
import { MerchantKeys } from '../enums/vtex.enum';
import { CoreTransactionDto } from '../dto/core-transaction.dto';
import { PaymentRequestDTO } from '../../application/dto/payment-request.dto';
import { PaymentResponseDto } from '../../application/dto/payment-response.dto';

@Injectable()
export class WalletApiClient {
  private logger = new Logger('WalletApiClient');

  public async payment(
    data: CreateTransactionDetail,
    origin: string,
  ): Promise<ResponseDTO<CoreTransactionDto>> {
    // (como id puede venir el commerceUserId, userDni, emailUser, userId)
    const headers: any = {
      'x-consumer-key': MerchantKeys[origin],
      'x-api-key': envConfig.walletApi.providerKey,
      'x-api-token': MerchantKeys[origin],
    };
    const url = URLS.walletApi.payment;

    const requestConfig: AxiosRequestConfig = {
      method: 'POST',
      headers: headers,
      url: url,
      data: data,
    };
    this.logger.debug('URL:' + url);
    try {
      const response: AxiosResponse<ResponseDTO<CoreTransactionDto>> =
        await axios(requestConfig);
      if (response.data) {
        return response.data;
      }
    } catch (e) {
      this.logger.error(
        `Error al conectar con api wallet para payment, Data: ${JSON.stringify(
          data,
        )}`,
        e.stack,
      );
      throw new InternalServerErrorException(e.message);
    }
  }

  public async cancel(
    paymentId: string,
    authorizationCode: string,
  ): Promise<ResponseDTO<CoreTransactionDto>> {
    const headers: any = {
      'x-consumer-key': MerchantKeys[origin],
      'x-api-key': envConfig.walletApi.providerKey,
    };
    const url = `${URLS.walletApi.payment}/${paymentId}`;

    const requestConfig: AxiosRequestConfig = {
      method: 'DELETE',
      headers: headers,
      url: url,
      params: { id: paymentId, authorizationCode: authorizationCode },
    };
    this.logger.debug('URL:' + url);
    try {
      const response: AxiosResponse<ResponseDTO<CoreTransactionDto>> =
        await axios(requestConfig);
      return response.data;
    } catch (e) {
      this.logger.error(
        `Error al conectar con api wallet para payment, Data: ${JSON.stringify(
          paymentId,
        )}. Error:${e.message}`,
        e.stack,
      );
      throw new InternalServerErrorException(e.message);
    }
  }

  public async settlement(
    paymentId: string,
  ): Promise<ResponseDTO<CoreTransactionDto>> {
    const headers: any = {
      'x-consumer-key': MerchantKeys[origin],
      'x-api-key': envConfig.walletApi.providerKey,
    };
    const url = URLS.walletApi.payment;

    const requestConfig: AxiosRequestConfig = {
      method: 'DELETE',
      headers: headers,
      url: url,
      params: { id: paymentId },
    };
    this.logger.debug('URL:' + url);
    try {
      const response: AxiosResponse<ResponseDTO<CoreTransactionDto>> =
        await axios(requestConfig);
      if (response.data) {
        const resp: ResponseDTO<CoreTransactionDto> = response.data;
        return resp;
      }
    } catch (e) {
      this.logger.error(
        `Error al conectar con api wallet para payment, Data: ${JSON.stringify(
          paymentId,
        )}`,
        e.stack,
      );
      throw new InternalServerErrorException(e.message);
    }
  }

  public async refund(
    paymentId: string,
    amount: number,
  ): Promise<ResponseDTO<CoreTransactionDto>> {
    const headers: any = {
      'x-consumer-key': MerchantKeys[origin],
      'x-api-key': envConfig.walletApi.providerKey,
    };
    const url = URLS.walletApi.payment;

    const requestConfig: AxiosRequestConfig = {
      method: 'DELETE',
      headers: headers,
      url: url,
      params: { id: paymentId },
    };
    this.logger.debug('URL:' + url);
    try {
      const response: AxiosResponse<ResponseDTO<CoreTransactionDto>> =
        await axios(requestConfig);
      return response.data;
    } catch (e) {
      this.logger.error(
        `Error al conectar con api wallet para payment, Data: ${JSON.stringify(
          paymentId,
        )}`,
        e.stack,
      );
      throw new InternalServerErrorException(e.message);
    }
  }

  public async callback(
    callbackUrl: string,
    response: PaymentResponseDto,
  ): Promise<void> {
    const headers: any = {
      'X-VTEX-API-AppKey': envConfig.server.kongKey,
      'X-VTEX-API-AppToken': envConfig.server.kongKey,
    };

    const requestConfig: AxiosRequestConfig = {
      method: 'POST',
      headers: headers,
      url: callbackUrl,
      data: response,
    };
    this.logger.debug('Realizando Callback a URL:' + callbackUrl);
    try {
      await axios(requestConfig);
      return;
    } catch (e) {
      this.logger.error(
        `Error al conectar con url: ${callbackUrl}. Para respuesta asincrona, Data: ${JSON.stringify(
          response,
        )}`,
        e.stack,
      );
      throw new InternalServerErrorException(e.message);
    }
  }
}
