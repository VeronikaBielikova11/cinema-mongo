import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Types } from 'mongoose';
import { objectIdParam, ParseObjectIdPipe } from '../common/object-id.js';
import { CreateFilmDto } from './dto/create-film.dto.js';
import { FilmResponseDto } from './dto/film-response.dto.js';
import { UpdateFilmDto } from './dto/update-film.dto.js';
import { FilmsService } from './films.service.js';

const BAD_ID = 'id не є коректним ObjectId (24 шістнадцяткові символи)';

@ApiTags('films')
@Controller('films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  @Post()
  @ApiOperation({ summary: 'Створити фільм' })
  @ApiCreatedResponse({ type: FilmResponseDto, description: 'Фільм створено' })
  @ApiBadRequestResponse({
    description: 'Поле відсутнє або має неправильний тип',
  })
  create(@Body() dto: CreateFilmDto): Promise<FilmResponseDto> {
    return this.filmsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Отримати всі фільми' })
  @ApiOkResponse({ type: [FilmResponseDto], description: 'Масив фільмів' })
  findAll(): Promise<FilmResponseDto[]> {
    return this.filmsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати фільм' })
  @ApiParam(objectIdParam('Ідентифікатор фільму'))
  @ApiOkResponse({ type: FilmResponseDto, description: 'Фільм' })
  @ApiBadRequestResponse({ description: BAD_ID })
  @ApiNotFoundResponse({ description: 'Фільму з таким id немає' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ): Promise<FilmResponseDto> {
    return this.filmsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Оновити фільм' })
  @ApiParam(objectIdParam('Ідентифікатор фільму'))
  @ApiOkResponse({ type: FilmResponseDto, description: 'Оновлений фільм' })
  @ApiBadRequestResponse({
    description: `Поле має неправильний тип або ${BAD_ID}`,
  })
  @ApiNotFoundResponse({ description: 'Фільму з таким id немає' })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateFilmDto,
  ): Promise<FilmResponseDto> {
    return this.filmsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Видалити фільм' })
  @ApiParam(objectIdParam('Ідентифікатор фільму'))
  @ApiNoContentResponse({ description: 'Фільм видалено' })
  @ApiBadRequestResponse({ description: BAD_ID })
  @ApiNotFoundResponse({ description: 'Фільму з таким id немає' })
  @ApiConflictResponse({ description: 'На фільм посилається сеанс' })
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<void> {
    return this.filmsService.remove(id);
  }
}
