import { IsBoolean } from 'class-validator';

export class ResolveDto {
  @IsBoolean()
  resolved!: boolean;
}
