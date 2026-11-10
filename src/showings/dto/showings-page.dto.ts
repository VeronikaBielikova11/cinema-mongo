import { ApiProperty } from '@nestjs/swagger';
import { ShowingDetailsDto } from './showing-response.dto.js';

export class ShowingsPageDto {
  @ApiProperty({
    type: [ShowingDetailsDto],
    description: 'Сеанси поточної сторінки',
  })
  items: ShowingDetailsDto[];

  @ApiProperty({
    example: 42,
    description: 'Скільки всього сеансів відповідає фільтрам',
  })
  total: number;

  @ApiProperty({ example: 1, description: 'Номер поточної сторінки' })
  page: number;

  @ApiProperty({ example: 20, description: 'Розмір сторінки' })
  limit: number;
}
