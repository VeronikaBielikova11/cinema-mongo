import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';

export function setupApp(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Cinema API')
    .setDescription(
      'Розклад сеансів і бронювання місць у кінотеатрі. Сховище — MongoDB. Усі ідентифікатори — ObjectId (24 шістнадцяткові символи); некоректний формат дає 400, неіснуючий документ — 404.',
    )
    .setVersion('3.0')
    .build();
  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
