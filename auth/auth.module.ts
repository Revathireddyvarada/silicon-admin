import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { SeedController } from './seed.controller';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { Token } from '../entities/token.entity';
import { TokenModule } from '../tokens/token.module';
import { UsersModule } from '../users/users.module';
import { City } from '../entities/city.entity';
import { Role } from '../entities/role.entity';
import {State} from '../entities/state.entity';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Token, City, Role, State]),
    TokenModule,
    UsersModule,
    S3Module
  ],
  controllers: [AuthController, SeedController],
  providers  : [AuthService],
  exports    : [AuthService], 
})
export class AuthModule {}