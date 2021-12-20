import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {}
  use(req: Request, res: Response, next: any) {
    this.logger.verbose(`Request - ${req.method} ${req.url} - Body: ${JSON.stringify(req.body)}`);
    next();
  }
}
