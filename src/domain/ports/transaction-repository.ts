import type {
  NewTransaction,
  Stats,
  Transaction,
  TransactionFilter,
  TransactionUpdate,
} from "../entities/transaction";

export interface TransactionRepository {
  list(filter: TransactionFilter): Promise<Transaction[]>;
  create(input: NewTransaction): Promise<number>;
  createMany(inputs: NewTransaction[]): Promise<number>;
  update(id: number, update: TransactionUpdate): Promise<void>;
  delete(id: number): Promise<void>;
  getStats(): Promise<Stats>;
}
