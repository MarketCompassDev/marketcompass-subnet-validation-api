import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { SubnetService } from './subnet.service';
import { CreateTwitterResponseDto } from './entity/create-twitter-response.dto';

@Controller('subnet')
export class SubnetController {
  constructor(private readonly subnetService: SubnetService) {}

  @Get('getNextRequest')
  getNextRequest(@Req() req: Request): Promise<any> {
    const apiKey = req['apiKey'] as string;
    return this.subnetService.getNextRequest(apiKey);
  }

  @Get('getNextRequests')
  getNextRequests(
    @Req() req: Request,
    @Query('count') count: number,
  ): Promise<any> {
    const apiKey = req['apiKey'] as string;
    const requestCount = Number(count) || 1;
    return this.subnetService.getNextRequests(apiKey, requestCount);
  }

  @Post('registerResponse')
  async registerResponse(
    @Body() createTwitterResponseDto: CreateTwitterResponseDto,
    @Req() req: Request,
  ): Promise<any> {
    const apiKey = req['apiKey'] as string;
    return this.subnetService.createTwitterResponse(
      createTwitterResponseDto,
      apiKey,
    );
  }
}
