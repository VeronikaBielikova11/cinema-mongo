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
import { BookingsService } from './bookings.service.js';
import {
  BookingResponseDto,
  ShowingSeatDto,
} from './dto/booking-response.dto.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

const BAD_ID = 'id не є коректним ObjectId (24 шістнадцяткові символи)';

@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('bookings')
  @ApiOperation({
    summary: 'Отримати всі бронювання',
    description: 'Збирає вкладені бронювання з усіх документів сеансів',
  })
  @ApiOkResponse({ type: [BookingResponseDto], description: 'Масив бронювань' })
  findAll(): Promise<BookingResponseDto[]> {
    return this.bookingsService.findAll();
  }

  @Post('showings/:id/bookings')
  @ApiOperation({
    summary: 'Забронювати місця на сеанс',
    description:
      'Місця позначаються зайнятими й бронювання записується одним оновленням документа сеансу.',
  })
  @ApiParam(objectIdParam('Ідентифікатор сеансу'))
  @ApiCreatedResponse({
    type: BookingResponseDto,
    description: 'Бронювання створено',
  })
  @ApiBadRequestResponse({
    description: `${BAD_ID}; масив порожній; елемент не містить row і seat як цілих додатних чисел; місце повторюється; місця немає в залі`,
  })
  @ApiNotFoundResponse({ description: 'Сеансу з таким id немає' })
  @ApiConflictResponse({
    description:
      'Хоча б одне місце вже заброньоване; жодне місце зі списку не бронюється',
  })
  create(
    @Param('id', ParseObjectIdPipe) showingId: Types.ObjectId,
    @Body() dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.create(showingId, dto);
  }

  @Get('showings/:id/bookings')
  @ApiOperation({ summary: 'Отримати бронювання сеансу' })
  @ApiParam(objectIdParam('Ідентифікатор сеансу'))
  @ApiOkResponse({
    type: [BookingResponseDto],
    description: 'Масив bookings документа сеансу',
  })
  @ApiBadRequestResponse({ description: BAD_ID })
  @ApiNotFoundResponse({ description: 'Сеансу з таким id немає' })
  findByShowing(
    @Param('id', ParseObjectIdPipe) showingId: Types.ObjectId,
  ): Promise<BookingResponseDto[]> {
    return this.bookingsService.findByShowing(showingId);
  }

  @Get('showings/:id/seats')
  @ApiOperation({ summary: 'Отримати місця залу із зайнятістю на сеансі' })
  @ApiParam(objectIdParam('Ідентифікатор сеансу'))
  @ApiOkResponse({ type: [ShowingSeatDto], description: 'Усі місця залу' })
  @ApiBadRequestResponse({ description: BAD_ID })
  @ApiNotFoundResponse({ description: 'Сеансу з таким id немає' })
  findSeats(
    @Param('id', ParseObjectIdPipe) showingId: Types.ObjectId,
  ): Promise<ShowingSeatDto[]> {
    return this.bookingsService.findSeats(showingId);
  }

  @Delete('bookings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Скасувати бронювання',
    description:
      'Звільняє місця й видаляє запис з масиву bookings одним оновленням',
  })
  @ApiParam(objectIdParam('Ідентифікатор бронювання'))
  @ApiNoContentResponse({ description: 'Бронювання скасовано' })
  @ApiBadRequestResponse({ description: BAD_ID })
  @ApiNotFoundResponse({
    description: 'Бронювання з таким id немає в жодному сеансі',
  })
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<void> {
    return this.bookingsService.remove(id);
  }
}
