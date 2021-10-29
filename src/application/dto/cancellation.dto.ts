import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export class CancellationRequestDTO {
  paymentId: string;
  requestId: string;
  authorizationId: string;
  sandboxMode: boolean | string;
}

export class CancellationResponseDTO {
  paymentId: string;
  cancellationId: string;
  code: string;
  message: string;
  requestId: string;
}
