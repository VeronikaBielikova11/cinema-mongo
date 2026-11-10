import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { isDuplicateKeyError } from '../common/mongo-errors.js';
import { Showing } from '../showings/schemas/showing.schema.js';
import { CreateHallDto } from './dto/create-hall.dto.js';
import {
  HallResponseDto,
  HallWithSeatsResponseDto,
} from './dto/hall-response.dto.js';
import { Hall } from './schemas/hall.schema.js';

@Injectable()
export class HallsService implements OnModuleInit {
  constructor(
    @InjectModel(Hall.name) private readonly hallModel: Model<Hall>,
    @InjectModel(Showing.name) private readonly showingModel: Model<Showing>,
  ) {}

  // Waits for the unique index on name, so the very first duplicate is already a 409.
  async onModuleInit() {
    await this.hallModel.init();
  }

  async create(dto: CreateHallDto): Promise<HallResponseDto> {
    try {
      // No lookup first: the unique index settles the race between two requests.
      const hall = await this.hallModel.create({
        name: dto.name,
        rows: dto.rows,
        seatsPerRow: dto.seatsPerRow,
      });
      return HallResponseDto.from(hall);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(`Hall named "${dto.name}" already exists`);
      }
      throw error;
    }
  }

  async findAll(): Promise<HallResponseDto[]> {
    const halls = await this.hallModel.find().sort({ name: 1 }).lean<Hall[]>();
    return halls.map((hall) => HallResponseDto.from(hall));
  }

  async findOne(id: Types.ObjectId): Promise<HallWithSeatsResponseDto> {
    const hall = await this.hallModel.findById(id).lean<Hall>();
    if (!hall) {
      throw new NotFoundException(`Hall with id "${id.toString()}" not found`);
    }
    return HallWithSeatsResponseDto.from(hall);
  }

  async remove(id: Types.ObjectId): Promise<void> {
    // MongoDB has no foreign keys, so dependent showings are looked up here.
    if (await this.showingModel.exists({ hall: id })) {
      throw new ConflictException(
        `Hall with id "${id.toString()}" is referenced by a showing and cannot be deleted`,
      );
    }
    const hall = await this.hallModel.findByIdAndDelete(id).lean<Hall>();
    if (!hall) {
      throw new NotFoundException(`Hall with id "${id.toString()}" not found`);
    }
  }
}
