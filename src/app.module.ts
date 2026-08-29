import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { OtpModule } from './otp/otp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ShipmentsModule,
    OtpModule,
  ],
})
export class AppModule {}
