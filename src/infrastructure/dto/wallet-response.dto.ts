export class ResponseDTO<T> {
  code: number; //0 ok; 1 error
  message: string;
  data?: T;
}

export class PaginatedResponseDTO<T> {
  code: number; //0 ok; 1 error
  message: string;
  data?: T;
  page?: number;
  limit?: number;
  totalPage?: number;
  recordTotal?: number;

}
