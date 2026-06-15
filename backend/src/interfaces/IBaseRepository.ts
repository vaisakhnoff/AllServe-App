// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FilterQuery<T> = { [P in keyof T]?: T[P] } & Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UpdateQuery<T> = { $set?: Partial<T>; $inc?: Partial<Record<keyof T, number>> } & Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PipelineStage = Record<string, any>;

export interface IBaseRepository<T, TCreate = Partial<T>> {
  create(data: TCreate): Promise<T>;
  findById(id: string): Promise<T | null>;
  findByEmail(email: string): Promise<T | null>;
  findAll(query?: FilterQuery<T>, page?: number, limit?: number): Promise<T[]>;
  count(query?: FilterQuery<T>): Promise<number>;
  update(id: string, data: UpdateQuery<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  aggregate?<R = Record<string, unknown>>(pipeline: PipelineStage[]): Promise<R[]>;
}