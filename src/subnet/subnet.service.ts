import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TwitterResponseEntity } from './entity/twitterResponse.entity';
import { Repository } from 'typeorm';
import { CreateTwitterResponseDto } from './entity/createTwitterResponse.dto';
import { HttpService } from '@nestjs/axios';
import { TwitterApi } from 'twitter-api-v2';

import { queries } from './queries';
import { RegisterVotingDto } from './entity/registerVoting.dto';
import { RegisteredModelsEntity } from './entity/registeredModels.entity';

@Injectable()
export class SubnetService {
  private queryCounts: Map<string, number> = new Map();
  private queryOpenCounts: Map<string, number> = new Map();
  private lastGlobalExecutionTime: number = 0;
  private blacklist: Map<string, number> = new Map();
  private latestVoting: string;

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
  private currentOpenIndex = 0;

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
      where: {id: apiKey}
    });
    if (user.length === 0) {
      throw new NotFoundException();
    }

    const collectedRequests = [];
    const sampleRequests = [
      {
        promptId: 1000,
        queryParams: {
          "max_results": 50,
          "start_time": "2024-04-01T05:00:00Z",
          "user.fields": "id,username,name",
          "tweet.fields": "created_at,author_id"
        },
        query: "bitcoin lang:en -is:retweet -copy -spam is:verified"
      },
      {
        promptId: 1001,
        queryParams: {
          "max_results": 50,
          "start_time": "2024-04-01T05:00:00Z",
          "user.fields": "id,username,name",
          "tweet.fields": "created_at,author_id"
        },
        query: "ethereum lang:en -is:retweet -copy -spam is:verified"
      },
      {
        promptId: 1002,
        queryParams: {
          "max_results": 50,
          "start_time": "2024-04-01T05:00:00Z",
          "user.fields": "id,username,name",
          "tweet.fields": "created_at,author_id"
        },
        query: "eth lang:en -is:retweet -copy -spam is:verified"
      },
      {
        promptId: 1003,
        queryParams: {
          "max_results": 50,
          "start_time": "2024-04-01T05:00:00Z",
          "user.fields": "id,username,name",
          "tweet.fields": "created_at,author_id"
        },
        query: "bittensor lang:en -is:retweet -copy -spam is:verified"
      },
      {
        promptId: 1004,
        queryParams: {
          "max_results": 50,
          "start_time": "2024-04-01T05:00:00Z",
          "user.fields": "id,username,name",
          "tweet.fields": "created_at,author_id"
        },
        query: "meme lang:en -is:retweet -copy -spam is:verified"
      },
      {
        promptId: 1005,
        queryParams: {
          "max_results": 50,
          "start_time": "2024-04-01T05:00:00Z",
          "user.fields": "id,username,name",
          "tweet.fields": "created_at,author_id"
        },
        query: "crypto lang:en -is:retweet -copy -spam is:verified"
      },
      {
        promptId: 1006,
        queryParams: {
          "max_results": 50,
          "start_time": "2024-04-01T05:00:00Z",
          "user.fields": "id,username,name",
          "tweet.fields": "created_at,author_id"
        },
        query: `"artificial intelligence" lang:en -is:retweet -copy -spam is:verified`
      }
    ];

    let remainingCount = count;
    let sampleIndex = Math.floor(Math.random() * sampleRequests.length);

    while (remainingCount > 0) {
      if (remainingCount > 0) {
        collectedRequests.push(queries[this.currentIndex]);
        this.currentIndex = (this.currentIndex + 1) % queries.length;
        remainingCount--;
      }
      if (remainingCount > 0) {
        collectedRequests.push(sampleRequests[sampleIndex]);
        sampleIndex = (sampleIndex + 1) % sampleRequests.length;
        remainingCount--;
      }
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

  async registerVoting(
    voting: RegisterVotingDto,
    apiKey: string,
  ): Promise<any> {
    const user = await this.registeredModelsRepository.find({
      where: { id: apiKey },
    });
    if (user.length === 0) {
      throw new NotFoundException();
    }
    try {
      this.latestVoting = voting.voting;
      return true;
    } catch (e) {
      throw new BadRequestException();
    }
  }

  async getLatestVoting(): Promise<any> {
    if (this.latestVoting) {
      return this.latestVoting;
    }
    throw new NotFoundException('Voting not registered.');
  }

  async getNextOpenRequest(): Promise<any> {
    const request = queries[this.currentOpenIndex];
    this.currentOpenIndex = (this.currentOpenIndex + 1) % queries.length;
    return request;
  }

  async getNextOpenRequests(count: number): Promise<any> {
    const collectedRequests = [];
    for (let i = 0; i < count; i++) {
      collectedRequests.push(queries[this.currentOpenIndex]);
      this.currentOpenIndex = (this.currentOpenIndex + 1) % queries.length;
    }
    return collectedRequests;
  }

  async createTwitterOpenResponse(
    createDto: CreateTwitterResponseDto,
    validatorId: string,
  ): Promise<any> {
    try {
      const newResponse = this.twitterResponseRepository.create({
        ...createDto,
        promptId: createDto.promptId,
        validatorId,
      });

      try {
        await this.twitterResponseRepository.save(newResponse);
        const userContent = JSON.parse(createDto.content);
        if (this.blacklist.has(createDto.minerId)) {
          return 0.05;
        }
        const minerIdToCheck = createDto.minerId;
        const queryCount = (this.queryOpenCounts.get(minerIdToCheck) || 0) + 1;
        this.queryOpenCounts.set(minerIdToCheck, queryCount);

        const currentTime = Date.now();
        const globalTimeElapsed = currentTime - this.lastGlobalExecutionTime;

        if (
          (queryCount > 100 || Math.random() < 0.01) &&
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
}
