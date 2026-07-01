import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ConversationsService } from './conversations.service';
import { SendReplyDto } from './dto/send-reply.dto';
import { SetAiPausedDto } from './dto/set-ai-paused.dto';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.conversations.list(user.id);
  }

  @Get(':customerId/messages')
  getMessages(@CurrentUser() user: AuthUser, @Param('customerId') customerId: string) {
    return this.conversations.getMessages(user.id, customerId);
  }

  @Post(':customerId/read')
  markRead(@CurrentUser() user: AuthUser, @Param('customerId') customerId: string) {
    return this.conversations.markRead(user.id, customerId);
  }

  @Patch(':customerId/ai')
  setAiPaused(
    @CurrentUser() user: AuthUser,
    @Param('customerId') customerId: string,
    @Body() dto: SetAiPausedDto,
  ) {
    return this.conversations.setAiPaused(user.id, customerId, dto.aiPaused);
  }

  @Post(':customerId/reply')
  reply(
    @CurrentUser() user: AuthUser,
    @Param('customerId') customerId: string,
    @Body() dto: SendReplyDto,
  ) {
    return this.conversations.sendManualReply(user.id, customerId, dto.text);
  }
}
