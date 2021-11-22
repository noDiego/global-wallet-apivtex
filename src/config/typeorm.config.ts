import { envConfig } from './index';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { AwsClient } from '../infrastructure/client/aws.client';
import { AwsResult } from '../infrastructure/dto/aws-result';

export const typeOrmModuleAsyncOptions: TypeOrmModuleAsyncOptions = {
  useFactory: async () => {
    if (!envConfig.isLocal) {
      const secret: AwsResult = await AwsClient.getSecret();
      return {
        type: envConfig.db.type as any,
        host: secret.db_hostname,
        port: secret.db_port,
        database: secret.db_name,
        synchronize: envConfig.db.synchronize,
        username: secret.db_username,
        password: secret.db_password,
        schema: envConfig.db.schema,
        autoLoadEntities: true,
        logging: false,
      };
    } else {
      return {
        type: envConfig.db.type as any,
        host: envConfig.db.host,
        port: envConfig.db.port,
        database: envConfig.db.database,
        synchronize: envConfig.db.synchronize,
        username: envConfig.db.user,
        password: envConfig.db.password,
        schema: envConfig.db.schema,
        autoLoadEntities: true,
        logging: false,
      };
    }
  },
};
