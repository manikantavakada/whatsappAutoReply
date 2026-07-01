import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { WhatsappService } from './whatsapp.service';

@Controller('webhook/whatsapp')
export class WhatsappWebhookController {
  constructor(private readonly whatsapp: WhatsappService) {}

  // Meta calls this once, when the webhook URL is registered in the App Dashboard,
  // to confirm we control the endpoint.
  @Get(':businessId')
  async verify(
    @Param('businessId') businessId: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const ok = await this.whatsapp.verifyWebhookToken(businessId, mode, token);
    if (ok) {
      res.status(HttpStatus.OK).send(challenge);
    } else {
      res.status(HttpStatus.FORBIDDEN).send('Verification failed');
    }
  }

  // Meta calls this for every inbound message / status update.
  @Post(':businessId')
  @HttpCode(HttpStatus.OK)
  async receive(
    @Param('businessId') businessId: string,
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: Request,
    @Body() body: unknown,
  ) {
    // Always acknowledge quickly so Meta doesn't retry-storm us; failures are logged, not thrown.
    this.whatsapp.handleIncomingWebhook(businessId, (req as any).rawBody, signature, body);
    return { received: true };
  }
}
