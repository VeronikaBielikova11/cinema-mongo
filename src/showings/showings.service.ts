import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { listSeats } from '../common/seat.js';
import { Film } from '../films/schemas/film.schema.js';
import { Hall } from '../halls/schemas/hall.schema.js';
import { CreateShowingDto } from './dto/create-showing.dto.js';
import { FindShowingsQueryDto } from './dto/find-showings-query.dto.js';
import {
  PopulatedShowing,
  ShowingDetailsDto,
  ShowingResponseDto,
} from './dto/showing-response.dto.js';
import { ShowingsPageDto } from './dto/showings-page.dto.js';
import { Showing } from './schemas/showing.schema.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// The nested arrays never leave the service through these routes.
const WITHOUT_ARRAYS = { seats: 0, bookings: 0 } as const;

@Injectable()
export class ShowingsService {
  constructor(
    @InjectModel(Showing.name) private readonly showingModel: Model<Showing>,
    @InjectModel(Film.name) private readonly filmModel: Model<Film>,
    @InjectModel(Hall.name) private readonly hallModel: Model<Hall>,
  ) {}

  async create(dto: CreateShowingDto): Promise<ShowingResponseDto> {
    const filmId = new Types.ObjectId(dto.filmId);
    const hallId = new Types.ObjectId(dto.hallId);

    const [film, hall] = await Promise.all([
      this.filmModel.exists({ _id: filmId }),
      this.hallModel
        .findById(hallId, { rows: 1, seatsPerRow: 1 })
        .lean<Pick<Hall, '_id' | 'rows' | 'seatsPerRow'>>(),
    ]);
    if (!film) {
      throw new BadRequestException(`Film with id "${dto.filmId}" not found`);
    }
    if (!hall) {
      throw new BadRequestException(`Hall with id "${dto.hallId}" not found`);
    }

    // The hall layout is expanded into the showing once, every seat starts free.
    const showing = await this.showingModel.create({
      film: filmId,
      hall: hallId,
      startsAt: new Date(dto.startsAt),
      price: dto.price,
      seats: listSeats(hall.rows, hall.seatsPerRow).map((seat) => ({
        ...seat,
        bookingId: null,
      })),
      bookings: [],
    });
    return ShowingResponseDto.from(showing);
  }

  async findAll({
    filmId,
    date,
    page,
    limit,
    sort,
  }: FindShowingsQueryDto): Promise<ShowingsPageDto> {
    // Filtering, sorting and paging all happen in MongoDB, never in memory.
    const filter: QueryFilter<Showing> = {};
    if (filmId) {
      filter.film = new Types.ObjectId(filmId);
    }
    if (date) {
      // Half-open UTC day keeps the startsAt index usable.
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      filter.startsAt = {
        $gte: dayStart,
        $lt: new Date(dayStart.getTime() + DAY_MS),
      };
    }
    const direction = sort === 'desc' ? -1 : 1;

    const [showings, total] = await Promise.all([
      this.showingModel
        .find(filter, WITHOUT_ARRAYS)
        .sort({ startsAt: direction, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('film', 'title')
        .populate('hall', 'name')
        .lean<PopulatedShowing[]>(),
      this.showingModel.countDocuments(filter),
    ]);

    return {
      items: showings.map((showing) =>
        ShowingDetailsDto.fromPopulated(showing),
      ),
      total,
      page,
      limit,
    };
  }

  async findOne(id: Types.ObjectId): Promise<ShowingDetailsDto> {
    const showing = await this.showingModel
      .findById(id, WITHOUT_ARRAYS)
      .populate('film', 'title')
      .populate('hall', 'name')
      .lean<PopulatedShowing>();
    if (!showing) {
      throw new NotFoundException(
        `Showing with id "${id.toString()}" not found`,
      );
    }
    return ShowingDetailsDto.fromPopulated(showing);
  }
}
