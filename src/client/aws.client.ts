import { Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { AwsResult } from '../interfaces/dto/aws-result';
import { envConfig } from '../config';

export class AwsClient {
  static async getSecret(): Promise<AwsResult> {
    Logger.log('Consultando credenciales de BD');
    let resultSecrets: any = null;
    try {
      Logger.debug('ENV: region(' + envConfig.aws.region + ') secretName(' + envConfig.aws.secretName + ')');
      const secretsManager = new AWS.SecretsManager({
        region: envConfig.aws.region,
      });
      const data = await secretsManager
        .getSecretValue({
          SecretId: envConfig.aws.secretName,
        })
        .promise();
      Logger.debug('AWS secret data: ' + JSON.stringify(data));
      resultSecrets = JSON.parse(data.SecretString).rds;
      Logger.debug('ResultSecrets rds: ' + JSON.stringify(resultSecrets));
      return resultSecrets;
    } catch (err) {
      Logger.error('Error al obtener aws secrets: ' + err);
    }
  }
}
