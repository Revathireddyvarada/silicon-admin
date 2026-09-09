import { Global, Module } from "@nestjs/common";
import { RedisService } from "./redis.service";
import { DispatchRedisService } from "./dispatch-redis.service";

@Global()
@Module({
  providers: [RedisService, DispatchRedisService],
  exports: [RedisService, DispatchRedisService],
})
export class RedisModule {}