import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { BusinessesService } from './businesses.service';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { ConnectWhatsAppDto } from './dto/connect-whatsapp.dto';

@UseGuards(JwtAuthGuard)
@Controller('business')
export class BusinessesController {
  constructor(private readonly businesses: BusinessesService) {}

  @Get('me')
  getProfile(@CurrentUser() user: AuthUser) {
    return this.businesses.getProfile(user.id);
  }

  @Patch('me')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateBusinessDto) {
    return this.businesses.update(user.id, dto);
  }

  @Get('overview')
  getOverview(@CurrentUser() user: AuthUser) {
    return this.businesses.getOverview(user.id);
  }

  @Post('whatsapp/connect')
  connectWhatsApp(@CurrentUser() user: AuthUser, @Body() dto: ConnectWhatsAppDto) {
    return this.businesses.connectWhatsApp(user.id, dto);
  }

  @Delete('whatsapp/connect')
  disconnectWhatsApp(@CurrentUser() user: AuthUser) {
    return this.businesses.disconnectWhatsApp(user.id);
  }
}
