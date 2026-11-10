import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Film, FilmSchema } from '../films/schemas/film.schema.js';
import { Hall, HallSchema } from '../halls/schemas/hall.schema.js';
import { Showing, ShowingSchema } from './schemas/showing.schema.js';
import { ShowingsController } from './showings.controller.js';
import { ShowingsService } from './showings.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Showing.name, schema: ShowingSchema },
      // Film and Hall are registered here too: populate resolves them by name,
      // and creating a showing checks that both exist.
      { name: Film.name, schema: FilmSchema },
      { name: Hall.name, schema: HallSchema },
    ]),
  ],
  controllers: [ShowingsController],
  providers: [ShowingsService],
})
export class ShowingsModule {}
