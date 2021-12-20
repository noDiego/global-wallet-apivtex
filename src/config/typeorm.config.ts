import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { envConfig } from './index';

// export const typeOrmConfig: TypeOrmModuleOptions = {
//   type: 'sqlite',
//   database: 'taskmanagement.db',
//   synchronize: true,
//   autoLoadEntities: true,
// };

export const typeOrmConfig: TypeOrmModuleOptions = {
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
