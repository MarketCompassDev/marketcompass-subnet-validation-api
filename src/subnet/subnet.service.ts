import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TwitterResponseEntity } from './entity/twitterResponse.entity';
import { Repository } from 'typeorm';
import { CreateTwitterResponseDto } from './entity/create-twitter-response.dto';
import { RegisteredModelsEntity } from './entity/registered-models.entity';
import { HttpService } from '@nestjs/axios';
import { TwitterApi } from 'twitter-api-v2';

import { queries } from './queries';

@Injectable()
export class SubnetService {
  private queryCounts: Map<string, number> = new Map();
  private lastGlobalExecutionTime: number = 0;
  private blacklist: Map<string, number> = new Map();

  private twitterClient;

  constructor(
    private httpService: HttpService,
    @InjectRepository(TwitterResponseEntity)
    private twitterResponseRepository: Repository<TwitterResponseEntity>,
    @InjectRepository(RegisteredModelsEntity)
    private registeredModelsRepository: Repository<RegisteredModelsEntity>,
  ) {
    this.twitterClient = new TwitterApi(process.env.TWITTER_API);
  }

  private currentIndex = 0;

  logBlacklist() {
    const blacklistArray = Array.from(this.blacklist.entries());
    console.log(JSON.stringify(blacklistArray));
  }

  async createTwitterResponse(
    createDto: CreateTwitterResponseDto,
    apiKey: string,
  ): Promise<any> {
    try {
      this.logBlacklist();

      const user = await this.registeredModelsRepository.find({
        where: { id: apiKey },
      });

      if (user.length === 0) {
        throw new NotFoundException();
      }

      const newResponse = this.twitterResponseRepository.create({
        ...createDto,
        promptId: createDto.promptId,
        validatorId: apiKey,
      });

      try {
        await this.twitterResponseRepository.save(newResponse);
        const userContent = JSON.parse(createDto.content);
        if (this.blacklist.has(createDto.minerId)) {
          return 0.05;
        }
        const minerIdToCheck = createDto.minerId;
        const queryCount = (this.queryCounts.get(minerIdToCheck) || 0) + 1;
        this.queryCounts.set(minerIdToCheck, queryCount);

        const currentTime = Date.now();
        const globalTimeElapsed = currentTime - this.lastGlobalExecutionTime;

        if (
          (queryCount > 30 || Math.random() < 0.03) &&
          globalTimeElapsed > 10000
        ) {
          this.lastGlobalExecutionTime = currentTime;
          const readOnlyClient = this.twitterClient.readOnly;
          const query = queries.find(
            (obj) => obj.promptId === +createDto.promptId,
          ).query;

          const userStartTime = userContent[0].created_at;
          const userStartDate = new Date(userStartTime);
          const currentDate = new Date();
          const diffInMillis = currentDate.getTime() - userStartDate.getTime();
          const diffInMinutes = diffInMillis / (1000 * 60);
          const isDiffLongerThanFiveMinutes = diffInMinutes > 0.5;
          const options = {
            max_results: 50,
            start_time: '2024-04-01T5:00:00Z',
            'user.fields': 'id',
            'tweet.fields': 'created_at',
          };
          if (!isDiffLongerThanFiveMinutes) {
            options['end_time'] = userStartTime;
          }
          try {
            const jsTweets = await readOnlyClient.v2.searchAll(query, options);
            const tweets = [];
            for (const tweet of jsTweets) {
              tweets.push(tweet);
            }
            const passed = this.isNinetyPercentMatch(tweets, userContent);
            this.queryCounts.set(minerIdToCheck, 0);
            if (!passed) {
              this.blacklist.set(createDto.minerId, new Date().getTime());
              return 0.05;
            }
          } catch (e) {
            return 0;
          }
        }
        return 1;
      } catch (e) {
        return 0.05;
      }
    } catch (e) {
      throw new BadRequestException();
    }
  }

  async getNextRequest(apiKey: string): Promise<any> {
    const user = await this.registeredModelsRepository.find({
      where: { id: apiKey },
    });
    if (user.length === 0) {
      throw new NotFoundException();
    }
    const request = queries[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % queries.length;
    return request;
  }

  async getNextRequests(apiKey: string, count: number): Promise<any> {
    const user = await this.registeredModelsRepository.find({
      where: { id: apiKey },
    });
    if (user.length === 0) {
      throw new NotFoundException();
    }
    const collectedRequests = [];
    for (let i = 0; i < count; i++) {
      collectedRequests.push(queries[this.currentIndex]);
      this.currentIndex = (this.currentIndex + 1) % queries.length;
    }
    return collectedRequests;
  }

  getMatchingPercentage = (arr1, arr2) => {
    const ids1 = arr1.map((item) => item.id);
    const ids2 = arr2.map((item) => item.id);

    const matchingCount = ids1.filter((id) => ids2.includes(id)).length;
    return (matchingCount / ids1.length) * 100;
  };

  isNinetyPercentMatch = (arr1, arr2) => {
    const percentage = this.getMatchingPercentage(arr1, arr2);
    return percentage >= 95;
  };
}
