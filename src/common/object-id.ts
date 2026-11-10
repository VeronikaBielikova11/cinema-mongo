import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ApiParamOptions } from '@nestjs/swagger';
import { Types } from 'mongoose';

// 24 hexadecimal characters. Types.ObjectId.isValid() is not used on purpose:
// it also accepts any 12-character string.
const OBJECT_ID = /^[a-f\d]{24}$/i;

export const OBJECT_ID_PATTERN = '^[a-fA-F0-9]{24}$';
export const OBJECT_ID_EXAMPLE = '651111111111111111111111';

export const isObjectId = (value: unknown): value is string =>
  typeof value === 'string' && OBJECT_ID.test(value);

export const objectIdMessage = (name: string) =>
  `${name} must be a valid ObjectId: a string of 24 hexadecimal characters`;

export function toObjectId(value: string, name = 'id'): Types.ObjectId {
  if (!isObjectId(value)) {
    throw new BadRequestException(objectIdMessage(name));
  }
  return new Types.ObjectId(value);
}

// Checks the id format before any query reaches MongoDB: a malformed id is a 400.
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<
  string,
  Types.ObjectId
> {
  transform(value: string) {
    return toObjectId(value);
  }
}

export const objectIdParam = (description: string): ApiParamOptions => ({
  name: 'id',
  description: `${description}. ObjectId: 24 шістнадцяткові символи`,
  schema: { type: 'string', pattern: OBJECT_ID_PATTERN },
  example: OBJECT_ID_EXAMPLE,
});
