import { Global, Logger, Module } from '@nestjs/common';
import { MainController } from "../controllers/main.controller";

@Global()
@Module({
  providers: [Logger],
  controllers: [MainController],
  exports: [Logger],
})
export class GlobalModule {}
