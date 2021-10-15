import { IsBoolean, IsNotEmpty, IsOptional } from "class-validator";

export class CancellationRequestDTO {
  @IsNotEmpty()
  paymentId: string;
  @IsNotEmpty()
  requestId: string;
  @IsNotEmpty()
  authorizationId: string;
  @IsOptional()
  @IsBoolean()
  sandboxMode: boolean;
}

export class CancellationResponseDTO {

  paymentId: string;
  cancellationId: string;
  code: string;
  message: string;
  requestId: string;
}
