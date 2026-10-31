import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DeviceId } from '../../common/decorators/device-id.decorator';
import { DeviceIdGuard } from '../../common/guards/device-id.guard';
import { CoCultivationService } from './co-cultivation.service';
import { CreateCoCultivationRoomDto } from './dto/create-co-cultivation-room.dto';
import { JoinCoCultivationRoomByIdDto } from './dto/join-co-cultivation-room-by-id.dto';
import { JoinCoCultivationRoomDto } from './dto/join-co-cultivation-room.dto';

@Controller('co-cultivation/rooms')
@UseGuards(DeviceIdGuard)
export class CoCultivationController {
  constructor(private readonly coCultivationService: CoCultivationService) {}

  @Get()
  listRooms() {
    return this.coCultivationService.listRooms();
  }

  @Post()
  createRoom(@DeviceId() deviceId: string, @Body() body: CreateCoCultivationRoomDto) {
    return this.coCultivationService.createRoom(deviceId!, body);
  }

  @Post('join')
  joinByCode(@DeviceId() deviceId: string, @Body() body: JoinCoCultivationRoomDto) {
    return this.coCultivationService.joinRoomByCode(deviceId!, body.roomCode, body.password);
  }

  @Post('quick-join')
  quickJoin(@DeviceId() deviceId: string) {
    return this.coCultivationService.quickJoin(deviceId!);
  }

  @Get(':roomId')
  getRoom(@DeviceId() deviceId: string, @Param('roomId') roomId: string) {
    return this.coCultivationService.getRoomViewForDevice(deviceId!, roomId);
  }

  @Post(':roomId/join')
  joinById(
    @DeviceId() deviceId: string,
    @Param('roomId') roomId: string,
    @Body() body: JoinCoCultivationRoomByIdDto,
  ) {
    return this.coCultivationService.joinRoom(deviceId!, roomId, body.password);
  }

  @Post(':roomId/leave')
  leaveRoom(@DeviceId() deviceId: string, @Param('roomId') roomId: string) {
    return this.coCultivationService.leaveRoom(deviceId!, roomId);
  }
}
