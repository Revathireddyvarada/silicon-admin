import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RealtimeHttpService } from "./realtime-http.service";

@Module({
  imports: [ConfigModule],
  providers: [RealtimeHttpService],
  exports: [RealtimeHttpService],
})
export class RealtimeHttpModule {}
