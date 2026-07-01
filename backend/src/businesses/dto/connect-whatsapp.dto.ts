import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConnectWhatsAppDto {
  @IsString()
  @MaxLength(40)
  waPhoneNumberId: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  waBusinessAccountId?: string;

  @IsString()
  @MaxLength(500)
  waAccessToken: string;

  @IsString()
  @MaxLength(200)
  waAppSecret: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  waDisplayNumber?: string;
}
