import { CommerceClientDTO } from './commerceClient.dto';

export class ClientDTO {
  id?: number;
  dni?: string;
  email?: string;
  commercesClients?: CommerceClientDTO[];
}
