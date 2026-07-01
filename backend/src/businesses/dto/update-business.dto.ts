import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsBoolean()
  aiEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  welcomeNote?: string;

  @IsOptional()
  @IsIn(['friendly', 'professional', 'concise'])
  aiTone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  autoReplyDelaySec?: number;
}
