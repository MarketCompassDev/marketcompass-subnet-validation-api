import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SubnetModule } from './subnet/subnet.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyMiddleware } from './middleware/api-key.middleware';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE,
      host: process.env.HOST,
      port: +process.env.PORT,
      username: process.env.USERNAME,
      password: process.env.PASSWORD,
      database: process.env.DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
    SubnetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyMiddleware)
      .forRoutes(
        { path: 'subnet/registerResponse', method: RequestMethod.POST },
        { path: 'subnet/registerLatestVoting', method: RequestMethod.POST },
        { path: 'subnet/getNextRequest', method: RequestMethod.GET },
        { path: 'subnet/getNextRequests', method: RequestMethod.GET },
      );
  }
}
