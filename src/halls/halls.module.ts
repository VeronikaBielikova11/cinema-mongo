import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Showing, ShowingSchema } from '../showings/schemas/showing.schema.js';
import { HallsController } from './halls.controller.js';
import { HallsService } from './halls.service.js';
import { Hall, HallSchema } from './schemas/hall.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hall.name, schema: HallSchema },
      // Read-only here: a hall with showings cannot be deleted.
      { name: Showing.name, schema: ShowingSchema },
    ]),
  ],
  controllers: [HallsController],
  providers: [HallsService],
})
export class HallsModule {}
