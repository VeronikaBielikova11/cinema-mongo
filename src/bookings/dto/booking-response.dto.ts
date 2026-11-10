import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { OBJECT_ID_PATTERN } from '../../common/object-id.js';
import { SeatDto } from '../../halls/dto/hall-response.dto.js';
import { Booking } from '../../showings/schemas/booking.schema.js';

export class BookingResponseDto {
  @ApiProperty({
    example: '654444444444444444444441',
    pattern: OBJECT_ID_PATTERN,
  })
  id: string;

  @ApiProperty({
    example: '653333333333333333333331',
    pattern: OBJECT_ID_PATTERN,
    description: 'Сеанс, у документі якого зберігається бронювання',
  })
  showingId: string;

  @ApiProperty({ type: [SeatDto] })
  seats: SeatDto[];

  @ApiProperty({
    example: 25000,
    description: 'Ціна сеансу, помножена на кількість місць, у копійках',
  })
  totalPrice: number;

  @ApiProperty({ example: '2030-01-01T10:00:00.000Z' })
  createdAt: Date;

  static from(booking: Booking, showingId: Types.ObjectId): BookingResponseDto {
    const dto = new BookingResponseDto();
    dto.id = booking._id.toString();
    dto.showingId = showingId.toString();
    dto.seats = booking.seats.map(({ row, seat }) => ({ row, seat }));
    dto.totalPrice = booking.totalPrice;
    dto.createdAt = booking.createdAt;
    return dto;
  }
}

export class ShowingSeatDto extends SeatDto {
  @ApiProperty({ example: false, description: 'true, якщо bookingId не null' })
  isBooked: boolean;
}
