import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { CreateHallDto } from './dto/create-hall.dto.js';
import {
  HallResponseDto,
  HallWithSeatsResponseDto,
} from './dto/hall-response.dto.js';
import { HallsService } from './halls.service.js';

const BAD_ID = 'id не є коректним ObjectId (24 шістнадцяткові символи)';

@ApiTags('halls')
@Controller('halls')
export class HallsController {
  constructor(private readonly hallsService: HallsService) {}

  @Post()
  @ApiOperation({ summary: 'Створити зал' })
  @ApiCreatedResponse({ type: HallResponseDto, description: 'Зал створено' })
  @ApiBadRequestResponse({
    description:
      'Поле відсутнє, має неправильний тип або число не є цілим додатним',
  })
  @ApiConflictResponse({ description: 'Зал з такою назвою вже існує' })
  create(@Body() dto: CreateHallDto): Promise<HallResponseDto> {
    return this.hallsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Отримати всі зали' })
  @ApiOkResponse({ type: [HallResponseDto], description: 'Масив залів' })
  findAll(): Promise<HallResponseDto[]> {
    return this.hallsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати зал із переліком місць' })
  @ApiParam(objectIdParam('Ідентифікатор залу'))
  @ApiOkResponse({
    type: HallWithSeatsResponseDto,
    description: 'Зал і його місця',
  })
  @ApiBadRequestResponse({ description: BAD_ID })
  @ApiNotFoundResponse({ description: 'Залу з таким id немає' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ): Promise<HallWithSeatsResponseDto> {
    return this.hallsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Видалити зал' })
  @ApiParam(objectIdParam('Ідентифікатор залу'))
  @ApiNoContentResponse({ description: 'Зал видалено' })
  @ApiBadRequestResponse({ description: BAD_ID })
  @ApiNotFoundResponse({ description: 'Залу з таким id немає' })
  @ApiConflictResponse({ description: 'На зал посилається сеанс' })
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<void> {
    return this.hallsService.remove(id);
  }
}
