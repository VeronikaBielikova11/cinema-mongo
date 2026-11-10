import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { seatLabel } from '../common/seat.js';
import { Hall } from '../halls/schemas/hall.schema.js';
import { Booking } from '../showings/schemas/booking.schema.js';
import { Showing } from '../showings/schemas/showing.schema.js';
import {
  BookingResponseDto,
  ShowingSeatDto,
} from './dto/booking-response.dto.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

type ShowingWithHall = Pick<Showing, '_id' | 'price'> & {
  hall: Pick<Hall, 'rows' | 'seatsPerRow' | 'name'>;
};

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Showing.name) private readonly showingModel: Model<Showing>,
  ) {}

  async create(
    showingId: Types.ObjectId,
    dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    // The DTO has already rejected an empty list, non-positive numbers and
    // repeated seats. Here: the showing must exist and every seat must be in the hall.
    const showing = await this.showingModel
      .findById(showingId, { price: 1, hall: 1 })
      .populate('hall', 'rows seatsPerRow name')
      .lean<ShowingWithHall>();
    if (!showing) {
      throw new NotFoundException(
        `Showing with id "${showingId.toString()}" not found`,
      );
    }

    const seats = dto.seats.map(({ row, seat }) => ({ row, seat }));
    // Checked before the update: its filter cannot tell a missing seat from a
    // taken one, so a seat outside the hall would otherwise become a 409.
    const outsideHall = seats.filter(
      ({ row, seat }) =>
        row > showing.hall.rows || seat > showing.hall.seatsPerRow,
    );
    if (outsideHall.length > 0) {
      throw new BadRequestException(
        `Hall "${showing.hall.name}" has no ${outsideHall.map(seatLabel).join(', ')}`,
      );
    }

    // The id is needed both in $set and in $push, so it is generated in code.
    const booking: Booking = {
      _id: new Types.ObjectId(),
      seats,
      totalPrice: showing.price * seats.length,
      createdAt: new Date(),
    };

    // One update of one document is atomic, no transaction is needed:
    // - the filter matches only while every requested seat is still free;
    // - $set marks those seats with the booking id, $push records the booking.
    // If any seat is taken, nothing matches and the document stays unchanged.
    const result = await this.showingModel.updateOne(
      {
        _id: showingId,
        $and: seats.map(({ row, seat }) => ({
          seats: { $elemMatch: { row, seat, bookingId: null } },
        })),
      },
      {
        $set: { 'seats.$[target].bookingId': booking._id },
        $push: { bookings: booking },
      },
      {
        arrayFilters: [
          {
            $or: seats.map(({ row, seat }) => ({
              'target.row': row,
              'target.seat': seat,
            })),
          },
        ],
      },
    );

    // The showing exists and the seats are valid, so no match means a taken seat.
    if (result.matchedCount === 0) {
      throw new ConflictException(
        `One or more seats are already booked: ${seats.map(seatLabel).join(', ')}`,
      );
    }
    return BookingResponseDto.from(booking, showingId);
  }

  // Bookings live inside showing documents, so they are collected from all of them.
  async findAll(): Promise<BookingResponseDto[]> {
    const rows = await this.showingModel.aggregate<
      Booking & { showingId: Types.ObjectId }
    >([
      { $match: { 'bookings.0': { $exists: true } } },
      { $unwind: '$bookings' },
      {
        $replaceRoot: {
          newRoot: { $mergeObjects: ['$bookings', { showingId: '$_id' }] },
        },
      },
      { $sort: { createdAt: 1, _id: 1 } },
    ]);
    return rows.map((row) => BookingResponseDto.from(row, row.showingId));
  }

  async findByShowing(
    showingId: Types.ObjectId,
  ): Promise<BookingResponseDto[]> {
    const showing = await this.showingModel
      .findById(showingId, { bookings: 1 })
      .lean<Pick<Showing, 'bookings'>>();
    if (!showing) {
      throw new NotFoundException(
        `Showing with id "${showingId.toString()}" not found`,
      );
    }
    return showing.bookings.map((booking) =>
      BookingResponseDto.from(booking, showingId),
    );
  }

  async findSeats(showingId: Types.ObjectId): Promise<ShowingSeatDto[]> {
    const showing = await this.showingModel
      .findById(showingId, { seats: 1 })
      .lean<Pick<Showing, 'seats'>>();
    if (!showing) {
      throw new NotFoundException(
        `Showing with id "${showingId.toString()}" not found`,
      );
    }
    return showing.seats.map(({ row, seat, bookingId }) => ({
      row,
      seat,
      isBooked: bookingId !== null,
    }));
  }

  async remove(id: Types.ObjectId): Promise<void> {
    // The booking id says nothing about its showing, so the showing is found by
    // the nested element. Freeing the seats and removing the booking is one update.
    const result = await this.showingModel.updateOne(
      { 'bookings._id': id },
      {
        $set: { 'seats.$[target].bookingId': null },
        $pull: { bookings: { _id: id } },
      },
      { arrayFilters: [{ 'target.bookingId': id }] },
    );
    if (result.matchedCount === 0) {
      throw new NotFoundException(
        `Booking with id "${id.toString()}" not found`,
      );
    }
  }
}
