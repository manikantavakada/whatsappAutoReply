import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { BusinessesModule } from '../businesses/businesses.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [BusinessesModule, WhatsappModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
