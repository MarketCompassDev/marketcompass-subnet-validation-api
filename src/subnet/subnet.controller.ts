import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { SubnetService } from './subnet.service';
import { CreateTwitterResponseDto } from './entity/createTwitterResponse.dto';
import { RegisterVotingDto } from './entity/registerVoting.dto';

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
  @Post('registerLatestVoting')
  async registerLatestVoting(
    @Body() voting: RegisterVotingDto,
    @Req() req: Request,
  ): Promise<any> {
    const apiKey = req['apiKey'] as string;
    return this.subnetService.registerVoting(voting, apiKey);
  }

  @Get('getLatestVoting')
  getLatestVoting(): Promise<any> {
    return this.subnetService.getLatestVoting();
  }

  @Get('getNextOpenRequest')
  getNextOpenRequest(): Promise<any> {
    return this.subnetService.getNextOpenRequest();
  }
  @Get('getNextOpenRequests')
  getNextOpenRequests(@Query('count') count: number): Promise<any> {
    const requestCount = Number(count) || 1;
    return this.subnetService.getNextOpenRequests(requestCount);
  }
  @Post('registerOpenResponse')
  async registerOpenResponse(
    @Body() createTwitterResponseDto: CreateTwitterResponseDto,
    @Req() req: Request,
  ): Promise<any> {
    const apiKey = req['apiKey'] as string;
    return this.subnetService.createTwitterOpenResponse(
      createTwitterResponseDto,
      apiKey,
    );
  }
}
