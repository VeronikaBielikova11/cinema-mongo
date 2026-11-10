import { ApiProperty } from '@nestjs/swagger';
import {
  OBJECT_ID_EXAMPLE,
  OBJECT_ID_PATTERN,
} from '../../common/object-id.js';
import { listSeats } from '../../common/seat.js';
import { Hall } from '../schemas/hall.schema.js';

export class SeatDto {
  @ApiProperty({ example: 1, minimum: 1 })
  row: number;

  @ApiProperty({ example: 1, minimum: 1 })
  seat: number;
}

export class HallResponseDto {
  @ApiProperty({ example: OBJECT_ID_EXAMPLE, pattern: OBJECT_ID_PATTERN })
  id: string;

  @ApiProperty({ example: 'Синій зал' })
  name: string;

  @ApiProperty({ example: 3 })
  rows: number;

  @ApiProperty({ example: 5 })
  seatsPerRow: number;

  static from(hall: Hall): HallResponseDto {
    const dto = new HallResponseDto();
    dto.id = hall._id.toString();
    dto.name = hall.name;
    dto.rows = hall.rows;
    dto.seatsPerRow = hall.seatsPerRow;
    return dto;
  }
}

export class HallWithSeatsResponseDto extends HallResponseDto {
  @ApiProperty({
    type: [SeatDto],
    description: 'Усі місця залу, обчислені з rows і seatsPerRow',
  })
  seats: SeatDto[];

  static override from(hall: Hall): HallWithSeatsResponseDto {
    const dto = Object.assign(
      new HallWithSeatsResponseDto(),
      HallResponseDto.from(hall),
    );
    dto.seats = listSeats(hall.rows, hall.seatsPerRow);
    return dto;
  }
}
