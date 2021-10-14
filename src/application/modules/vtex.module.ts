import { VtexController } from "../controllers/vtex.controller";
import { VtexService } from "../../domain/services/vtex.service";
import { Module } from "@nestjs/common";
import { WalletApiClient } from "../../infrastructure/client/wallet-api.client";

@Module({
    controllers: [VtexController],
    providers: [VtexService, WalletApiClient],
})
export class VtexModule {}
