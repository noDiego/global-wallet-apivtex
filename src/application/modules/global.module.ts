import { Global, Logger, Module } from '@nestjs/common';
import { MainController } from "../controllers/main.controller";
import { VtexController } from "../controllers/vtex.controller";

@Global()
@Module({
  providers: [Logger],
  controllers: [MainController, VtexController],
  exports: [Logger],
})
export class GlobalModule {}
