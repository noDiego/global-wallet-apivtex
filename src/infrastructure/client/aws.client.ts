import { Logger } from '@nestjs/common';
// import * as AWS from 'aws-sdk';
import { envConfig } from '../../config';
import { AwsResult } from '../dto/aws-result';

export class AwsClient {
  static async getSecret(): Promise<AwsResult> {
    // Logger.debug(' ingreso a getSecret()');
    // let resultSecrets: any = null;
    try {
      //   Logger.debug('ENV: region(' + envConfig.aws.region + ') secretName(' + envConfig.aws.secretName + ')');
      //   const secretsManager = new AWS.SecretsManager({
      //     region: envConfig.aws.region,
      //   });
      //   const data = await secretsManager
      //     .getSecretValue({
      //       SecretId: envConfig.aws.secretName,
      //     })
      //     .promise();
      //   Logger.debug('AWS secret data: ' + JSON.stringify(data));
      //   resultSecrets = JSON.parse(data.SecretString).rds;
      //   Logger.debug('ResultSecrets rds: ' + JSON.stringify(resultSecrets));
      //   return resultSecrets;
      return {
        db_endpoint: 'cl-ccom-monedero.cqpeqdephwqv.us-east-1.rds.amazonaws.com',
        db_hostname: 'cl-ccom-monedero.cqpeqdephwqv.us-east-1.rds.amazonaws.com',
        db_name: 'monedero_db',
        db_password: 'monedero123',
        db_port: 3306,
        db_username: 'monedero_user',
      };
    } catch (err) {
      Logger.error('Error al obtener aws secrets: ' + err);
    }
  }
}
