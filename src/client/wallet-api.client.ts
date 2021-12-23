import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { envConfig } from '../config';
import { URLS } from '../constants/urls';
import { MerchantKeys } from '../interfaces/enums/vtex.enum';
import { CoreResponse, CoreTransactionReq, CoreTransactionRes } from '../interfaces/dto/core-transaction.dto';
import { PaymentResponseDto } from '../interfaces/wallet/payment-response.dto';

@Injectable()
export class WalletApiClient {
  private logger = new Logger('WalletApiClient');

  public async payment(data: CoreTransactionReq, origin: string, commerceSession?: string): Promise<CoreResponse> {
    // (como id puede venir el commerceUserId, userDni, emailUser, userId)
    const headers: any = {
      'x-api-session': commerceSession,
      'x-api-key': envConfig.walletApi.apiKey,
      'x-api-token': MerchantKeys[origin],
    };
    this.logger.debug(headers);
    const url = URLS.walletApi.payment;

    const requestConfig: AxiosRequestConfig = {
      method: 'POST',
      headers: headers,
      url: url,
      data: data,
    };
    this.logger.debug('URL:' + url);
    try {
      const response: AxiosResponse<CoreResponse> = await axios(requestConfig);
      return response.data;
    } catch (e) {
      this.logger.error(`Error al conectar con api wallet para payment, Data: ${JSON.stringify(data)}`, e.stack);
      throw new InternalServerErrorException(e);
    }
  }

  public async settlement(paymentId: string): Promise<CoreResponse> {
    const headers: any = {
      'x-consumer-key': MerchantKeys[origin],
      'x-api-key': envConfig.walletApi.apiKey,
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
      const response: AxiosResponse<CoreResponse> = await axios(requestConfig);
      const resp: CoreResponse = response.data;
      return resp;
    } catch (e) {
      this.logger.error(`Error al conectar con api wallet para payment, Data: ${JSON.stringify(paymentId)}`, e.stack);
      throw new InternalServerErrorException(e);
    }
  }

  public async refund(paymentId: string, amount: number, commerceSession: string): Promise<CoreResponse> {
    const headers: any = {
      'x-api-session': commerceSession,
      'x-api-key': envConfig.walletApi.apiKey,
      'x-api-token': MerchantKeys[origin],
    };
    const url = `${URLS.walletApi.payment}/${paymentId}/vtexrefunds`;

    const requestConfig: AxiosRequestConfig = {
      method: 'POST',
      headers: headers,
      url: url,
      params: { amount: amount },
    };
    this.logger.debug('URL:' + url);
    try {
      const response: AxiosResponse<CoreResponse> = await axios(requestConfig);
      return response.data;
    } catch (e) {
      this.logger.error(`Error al conectar con api wallet para payment, Data: ${JSON.stringify(paymentId)}`, e.stack);
      throw new InternalServerErrorException(e);
    }
  }

  public async callback(callbackUrl: string, response: PaymentResponseDto): Promise<void> {
    const headers: any = {
      'X-VTEX-API-AppKey': envConfig.vtex.jumbo.appkey,
      'X-VTEX-API-AppToken': envConfig.vtex.jumbo.apptoken,
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
      const errorMsg =
        `Error al conectar con url: ${callbackUrl}. Para respuesta asincrona, Data: ${JSON.stringify(response)}` +
        e.response
          ? ` Response: ${e.response}`
          : ``;
      this.logger.error(
          errorMsg,
        e.stack,
      );
      throw new InternalServerErrorException(e, errorMsg);
    }
  }
}
