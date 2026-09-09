import { PartialType } from "@nestjs/swagger";
import { CreateTripRatingReasonDto } from "./create-trip-rating-reason.dto";

export class UpdateTripRatingReasonDto extends PartialType(CreateTripRatingReasonDto) {}
