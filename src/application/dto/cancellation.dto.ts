export class CancellationRequestDTO {
  paymentId: string;
  requestId: string;
  authorizationId: string;
  sandboxMode: string;
}

export class CancellationResponseDTO {
  paymentId: string;
  cancellationId: string;
  code: string;
  message: string;
  requestId: string;
}
