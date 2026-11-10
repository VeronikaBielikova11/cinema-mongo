import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import {
  OBJECT_ID_EXAMPLE,
  OBJECT_ID_PATTERN,
} from '../../common/object-id.js';
import { Showing } from '../schemas/showing.schema.js';

// A showing as created: references stay ids, seats and bookings are left out.
export class ShowingResponseDto {
  @ApiProperty({
    example: '653333333333333333333331',
    pattern: OBJECT_ID_PATTERN,
  })
  id: string;

  @ApiProperty({ example: OBJECT_ID_EXAMPLE, pattern: OBJECT_ID_PATTERN })
  filmId: string;

  @ApiProperty({
    example: '652222222222222222222221',
    pattern: OBJECT_ID_PATTERN,
  })
  hallId: string;

  @ApiProperty({
    example: '2030-06-15T18:00:00.000Z',
    description: 'Початок сеансу в UTC',
  })
  startsAt: Date;

  @ApiProperty({ example: 12500, description: 'Ціна квитка в копійках' })
  price: number;

  static from(showing: Showing): ShowingResponseDto {
    const dto = new ShowingResponseDto();
    dto.id = showing._id.toString();
    dto.filmId = showing.film.toString();
    dto.hallId = showing.hall.toString();
    dto.startsAt = showing.startsAt;
    dto.price = showing.price;
    return dto;
  }
}

// Shape of a showing after populate('film', 'title') and populate('hall', 'name').
export type PopulatedShowing = Omit<
  Showing,
  'film' | 'hall' | 'seats' | 'bookings'
> & {
  film: { _id: Types.ObjectId; title: string };
  hall: { _id: Types.ObjectId; name: string };
};

// A showing with the film title and hall name, as the schedule shows it.
export class ShowingDetailsDto extends ShowingResponseDto {
  @ApiProperty({ example: 'Тіні забутих предків' })
  filmTitle: string;

  @ApiProperty({ example: 'Синій зал' })
  hallName: string;

  static fromPopulated(showing: PopulatedShowing): ShowingDetailsDto {
    const dto = new ShowingDetailsDto();
    dto.id = showing._id.toString();
    dto.filmId = showing.film._id.toString();
    dto.filmTitle = showing.film.title;
    dto.hallId = showing.hall._id.toString();
    dto.hallName = showing.hall.name;
    dto.startsAt = showing.startsAt;
    dto.price = showing.price;
    return dto;
  }
}
