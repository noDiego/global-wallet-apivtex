import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { envConfig } from './index';
import { AwsResult } from '../interfaces/dto/aws-result';
import { AwsClient } from '../client/aws.client';

export const typeOrmModuleAsyncOptions: TypeOrmModuleAsyncOptions = {
  useFactory: async () => {
    if (!envConfig.isDev) {
      const secret: AwsResult = await AwsClient.getSecret();
      return {
        type: envConfig.db.type as any,
        host: secret.db_hostname,
        port: secret.db_port,
        database: secret.db_name,
        synchronize: false,
        username: secret.db_username,
        password: secret.db_password,
        schema: envConfig.db.schema,
        autoLoadEntities: true,
        logging: false,
        useUTC: true,
        migrations: ['dist/migrations/*.js'],
        cli: {
          migrationsDir: 'migrations',
        },
        extra: {
          connectionLimit: 5,
        },
      };
    } else {
      return {
        type: envConfig.db.type as any,
        host: envConfig.db.host,
        port: envConfig.db.port,
        database: envConfig.db.database,
        synchronize: false,
        username: envConfig.db.user,
        password: envConfig.db.password,
        schema: envConfig.db.schema,
        autoLoadEntities: true,
        logging: false,
        useUTC: true,
        migrations: ['dist/migrations/*.js'],
        cli: {
          migrationsDir: 'migrations',
        },
        extra: {
          connectionLimit: 5,
        },
      };
    }
  },
};
