import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { envConfig } from '../config';
import { URLS } from '../constants/urls';
import { MerchantKeys } from '../interfaces/enums/vtex.enum';
import { CoreResponse, CoreTransactionReq } from '../interfaces/dto/core-transaction.dto';
import { PaymentResponseDto } from '../interfaces/wallet/payment-response.dto';
import { CommerceDto } from '../interfaces/dto/commerce.dto';

@Injectable()
export class WalletApiClient {
  private logger = new Logger('WalletApiClient');

  public async payment(
    data: CoreTransactionReq,
    commerceToken: string,
    commerceSession?: string,
  ): Promise<CoreResponse> {
    // (como id puede venir el commerceUserId, userDni, emailUser, userId)
    const headers: any = {
      'x-api-session': commerceSession,
      'x-api-token': commerceToken,
    };
    this.logger.debug(headers);
    const url = URLS.walletApi.vtexpayment;

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
      this.logger.error(
        `PaymentId:${data.paymentId} | Error al conectar con api wallet para payment, Data: ${JSON.stringify(data)}`,
        e.stack,
      );
      throw new InternalServerErrorException(e.message);
    }
  }

  public async upselling(data: CoreTransactionReq, parentId: string, origin: string): Promise<CoreResponse> {
    // (como id puede venir el commerceUserId, userDni, emailUser, userId)
    const headers: any = {
      'x-api-token': MerchantKeys[origin],
    };
    this.logger.debug(headers);
    const url = `${URLS.walletApi.vtexpayment}/${parentId}/upselling`;

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
      this.logger.error(
        `PaymentId:${data.paymentId} | Error al conectar con api wallet para upselling, Data: ${JSON.stringify(data)}`,
        e.stack,
      );
      throw new InternalServerErrorException(e.message);
    }
  }

  public async refund(coreId: string, amount: number, commerceToken: string): Promise<CoreResponse> {
    const headers: any = {
      // 'x-api-session': commerceSession,
      'x-api-token': commerceToken,
    };
    const url = `${URLS.walletApi.vtexpayment}/${coreId}/refunds`;

    const requestConfig: AxiosRequestConfig = {
      method: 'POST',
      headers: headers,
      url: url,
      data: { amount: amount },
    };
    this.logger.debug('URL:' + url);
    try {
      const response: AxiosResponse<CoreResponse> = await axios(requestConfig);
      return response.data;
    } catch (e) {
      this.logger.error(`Error al conectar con api wallet para payment, Data: ${JSON.stringify(coreId)}`, e.stack);
      throw new InternalServerErrorException(e.message);
    }
  }

  public async callback(callbackUrl: string, body: PaymentResponseDto, commerce: CommerceDto): Promise<any> {
    const headers: any = {
      'X-VTEX-API-AppKey': commerce.vtexAppKey,
      'X-VTEX-API-AppToken': commerce.vtexAppToken,
    };

    const requestConfig: AxiosRequestConfig = {
      method: 'POST',
      headers: headers,
      url: callbackUrl,
      data: body,
    };

    this.logger.debug(`PaymentId:${body.paymentId} | Callback - Realizando Callback a URL:` + callbackUrl);
    try {
      const resp: AxiosResponse = await axios(requestConfig);
      this.logger.log(
        `PaymentId:${body.paymentId} | Callback - Response de CallBack - status:${
          resp.status
        } - response:${JSON.stringify(resp.data)}`,
      );
      return resp.data;
    } catch (e) {
      let errorMsg = `Callback - Error al conectar con url: ${callbackUrl}. Para respuesta asincrona, Data: ${JSON.stringify(
        body,
      )}`;
      if (e.isAxiosError) {
        const a = e as AxiosError;
        errorMsg =
          errorMsg + ' Response - Status:' + a.response.status + ' ResponseBody:' + JSON.stringify(e.response.data);
      }
      this.logger.error(`PaymentId:${body.paymentId} | ${errorMsg}`, e.stack);
      throw new InternalServerErrorException(errorMsg);
    }
  }
}
