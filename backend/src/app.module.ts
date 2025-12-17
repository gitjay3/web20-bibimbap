import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventTypeModule } from './event-type/event-type.module';

@Module({
  imports: [EventTypeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
