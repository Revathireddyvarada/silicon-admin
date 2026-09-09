import { Controller, Get, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { HelplineSettingsService } from "./helpline-settings.service";
import { UpsertHelplineDto } from "./dto/helpline-settings.dto";
import { Public } from "../decorators/public.decorator";

@ApiTags("helpline-settings")
@Controller(["helpline-settings", "web-admin/helpline-settings"])
export class HelplineSettingsController {
  constructor(private readonly service: HelplineSettingsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Get helpline settings" })
  @ApiResponse({ status: 200, description: "Helpline settings" })
  get() {
    return this.service.get();
  }

  @Post()
  @ApiOperation({ summary: "Create or update helpline settings" })
  @ApiResponse({ status: 200, description: "Helpline settings upserted" })
  upsert(@Body() dto: UpsertHelplineDto) {
    return this.service.upsert(dto);
  }
}
