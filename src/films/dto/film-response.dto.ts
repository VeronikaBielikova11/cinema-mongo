import { ApiProperty } from '@nestjs/swagger';
import {
  OBJECT_ID_EXAMPLE,
  OBJECT_ID_PATTERN,
} from '../../common/object-id.js';
import { Film } from '../schemas/film.schema.js';

// The response never carries _id: the ObjectId becomes a plain string id.
export class FilmResponseDto {
  @ApiProperty({ example: OBJECT_ID_EXAMPLE, pattern: OBJECT_ID_PATTERN })
  id: string;

  @ApiProperty({ example: 'Тіні забутих предків' })
  title: string;

  @ApiProperty({ example: 97, description: 'Тривалість у хвилинах' })
  durationMinutes: number;

  @ApiProperty({ example: 1965 })
  releaseYear: number;

  static from(film: Film): FilmResponseDto {
    const dto = new FilmResponseDto();
    dto.id = film._id.toString();
    dto.title = film.title;
    dto.durationMinutes = film.durationMinutes;
    dto.releaseYear = film.releaseYear;
    return dto;
  }
}
