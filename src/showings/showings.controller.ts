import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Types } from 'mongoose';
import { objectIdParam, ParseObjectIdPipe } from '../common/object-id.js';
import { CreateShowingDto } from './dto/create-showing.dto.js';
import { FindShowingsQueryDto } from './dto/find-showings-query.dto.js';
import {
  ShowingDetailsDto,
  ShowingResponseDto,
} from './dto/showing-response.dto.js';
import { ShowingsPageDto } from './dto/showings-page.dto.js';
import { ShowingsService } from './showings.service.js';

@ApiTags('showings')
@Controller('showings')
export class ShowingsController {
  constructor(private readonly showingsService: ShowingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Створити сеанс',
    description:
      'Сервіс розгортає схему залу в масив seats (усі місця вільні), bookings створюється порожнім. Масиви у відповідь не потрапляють.',
  })
  @ApiCreatedResponse({
    type: ShowingResponseDto,
    description: 'Сеанс створено',
  })
  @ApiBadRequestResponse({
    description:
      'filmId чи hallId не є ObjectId, фільму або залу немає, startsAt некоректний чи в минулому, price не є цілим додатним',
  })
  create(@Body() dto: CreateShowingDto): Promise<ShowingResponseDto> {
    return this.showingsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Отримати розклад сеансів',
    description:
      'Фільтрація за фільмом і добою, посторінкова видача, сортування за часом початку виконуються запитом до MongoDB. Сеанси з однаковим часом упорядковані за _id.',
  })
  @ApiOkResponse({
    type: ShowingsPageDto,
    description: 'Сторінка сеансів і загальна кількість',
  })
  @ApiBadRequestResponse({
    description:
      'filmId не є ObjectId, page чи limit не є цілим числом або поза межами, date не відповідає YYYY-MM-DD, sort не asc і не desc',
  })
  findAll(@Query() query: FindShowingsQueryDto): Promise<ShowingsPageDto> {
    return this.showingsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати сеанс з назвами фільму й залу' })
  @ApiParam(objectIdParam('Ідентифікатор сеансу'))
  @ApiOkResponse({ type: ShowingDetailsDto, description: 'Сеанс' })
  @ApiBadRequestResponse({
    description: 'id не є коректним ObjectId (24 шістнадцяткові символи)',
  })
  @ApiNotFoundResponse({ description: 'Сеансу з таким id немає' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ): Promise<ShowingDetailsDto> {
    return this.showingsService.findOne(id);
  }
}
