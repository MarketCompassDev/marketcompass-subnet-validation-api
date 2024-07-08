import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubnetService } from './subnet.service';
import { SubnetController } from './subnet.controller';
import { TwitterResponseEntity } from './entity/twitterResponse.entity';
import { HttpModule } from '@nestjs/axios';
import { RegisteredModelsEntity } from './entity/registeredModels.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([TwitterResponseEntity, RegisteredModelsEntity]),
  ],
  providers: [SubnetService],
  controllers: [SubnetController],
})
export class SubnetModule {}
