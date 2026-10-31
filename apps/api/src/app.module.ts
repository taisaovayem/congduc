import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountModule } from './modules/account/account.module';
import { IncenseModule } from './modules/incense/incense.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { CoCultivationModule } from './modules/co-cultivation/co-cultivation.module';
import { TransferModule } from './modules/transfer/transfer.module';
import { typeOrmConfig } from './database/typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig()),
    CqrsModule.forRoot(),
    AccountModule,
    IncenseModule,
    RealtimeModule,
    TransferModule,
    CoCultivationModule,
  ],
})
export class AppModule {}
