import { Model, Document } from "mongoose";
import { IBaseRepository, FilterQuery, UpdateQuery, PipelineStage } from "../interfaces/IBaseRepository";

export abstract class BaseRepository<T extends Document, TCreate = Partial<T>>
  implements IBaseRepository<T, TCreate>
{
  constructor(protected readonly model: Model<T>) {}

  async create(data: TCreate): Promise<T> {
    return new this.model(data as Record<string, unknown>).save() as Promise<T>;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findByEmail(email: string): Promise<T | null> {
    return this.model.findOne({ email } as unknown as FilterQuery<T>).exec();
  }

  async findAll(query: FilterQuery<T> = {}, page = 1, limit = 10): Promise<T[]> {
    return this.model
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async count(query: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(query).exec();
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  async aggregate<R = Record<string, unknown>>(pipeline: PipelineStage[]): Promise<R[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.model.aggregate<R>(pipeline as any).exec();
  }
}