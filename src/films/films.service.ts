import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Showing } from '../showings/schemas/showing.schema.js';
import { CreateFilmDto } from './dto/create-film.dto.js';
import { FilmResponseDto } from './dto/film-response.dto.js';
import { UpdateFilmDto } from './dto/update-film.dto.js';
import { Film } from './schemas/film.schema.js';

@Injectable()
export class FilmsService {
  constructor(
    @InjectModel(Film.name) private readonly filmModel: Model<Film>,
    @InjectModel(Showing.name) private readonly showingModel: Model<Showing>,
  ) {}

  async create(dto: CreateFilmDto): Promise<FilmResponseDto> {
    const film = await this.filmModel.create({
      title: dto.title,
      durationMinutes: dto.durationMinutes,
      releaseYear: dto.releaseYear,
    });
    return FilmResponseDto.from(film);
  }

  async findAll(): Promise<FilmResponseDto[]> {
    const films = await this.filmModel
      .find()
      .sort({ title: 1, _id: 1 })
      .lean<Film[]>();
    return films.map((film) => FilmResponseDto.from(film));
  }

  async findOne(id: Types.ObjectId): Promise<FilmResponseDto> {
    const film = await this.filmModel.findById(id).lean<Film>();
    if (!film) {
      throw new NotFoundException(`Film with id "${id.toString()}" not found`);
    }
    return FilmResponseDto.from(film);
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateFilmDto,
  ): Promise<FilmResponseDto> {
    const changes = Object.fromEntries(
      Object.entries({
        title: dto.title,
        durationMinutes: dto.durationMinutes,
        releaseYear: dto.releaseYear,
      }).filter(([, value]) => value !== undefined),
    );
    const film = await this.filmModel
      .findByIdAndUpdate(
        id,
        { $set: changes },
        { returnDocument: 'after', runValidators: true },
      )
      .lean<Film>();
    if (!film) {
      throw new NotFoundException(`Film with id "${id.toString()}" not found`);
    }
    return FilmResponseDto.from(film);
  }

  async remove(id: Types.ObjectId): Promise<void> {
    // MongoDB has no foreign keys, so dependent showings are looked up here.
    if (await this.showingModel.exists({ film: id })) {
      throw new ConflictException(
        `Film with id "${id.toString()}" is referenced by a showing and cannot be deleted`,
      );
    }
    const film = await this.filmModel.findByIdAndDelete(id).lean<Film>();
    if (!film) {
      throw new NotFoundException(`Film with id "${id.toString()}" not found`);
    }
  }
}
