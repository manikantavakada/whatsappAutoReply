import { IsBoolean } from 'class-validator';

export class SetAiPausedDto {
  @IsBoolean()
  aiPaused: boolean;
}
