import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DeviceId } from '../../common/decorators/device-id.decorator';
import { DeviceIdGuard } from '../../common/guards/device-id.guard';
import { CreatePkRoomDto } from './dto/create-pk-room.dto';
import { JoinPkRoomByIdDto } from './dto/join-pk-room-by-id.dto';
import { JoinPkRoomDto } from './dto/join-pk-room.dto';
import { PkService } from './pk.service';

@Controller('pk/rooms')
@UseGuards(DeviceIdGuard)
export class PkController {
  constructor(private readonly pkService: PkService) {}

  @Get()
  listRooms() {
    return this.pkService.listRooms();
  }

  @Post()
  createRoom(@DeviceId() deviceId: string, @Body() body: CreatePkRoomDto) {
    return this.pkService.createRoom(deviceId!, body);
  }

  @Post('join')
  joinByCode(@DeviceId() deviceId: string, @Body() body: JoinPkRoomDto) {
    return this.pkService.joinRoomByCode(deviceId!, body.roomCode, body.password);
  }

  @Post('quick-join')
  quickJoin(@DeviceId() deviceId: string) {
    return this.pkService.quickJoin(deviceId!);
  }

  @Get(':roomId')
  getRoom(@DeviceId() deviceId: string, @Param('roomId') roomId: string) {
    return this.pkService.getRoomViewForDevice(deviceId!, roomId);
  }

  @Post(':roomId/join')
  joinById(
    @DeviceId() deviceId: string,
    @Param('roomId') roomId: string,
    @Body() body: JoinPkRoomByIdDto,
  ) {
    return this.pkService.joinRoom(deviceId!, roomId, body.password);
  }

  @Post(':roomId/leave')
  leaveRoom(@DeviceId() deviceId: string, @Param('roomId') roomId: string) {
    return this.pkService.leaveRoom(deviceId!, roomId);
  }
}
