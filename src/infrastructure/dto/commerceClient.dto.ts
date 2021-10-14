import { TransactionDto } from "./transaction.dto";
import { ClientDTO } from "./client.dto";

export class CommerceClientDTO {
  id?: number;
  origin?: string;
  commerceUserId?: string;
  client?: ClientDTO;
  transactions?: TransactionDto[];
}
