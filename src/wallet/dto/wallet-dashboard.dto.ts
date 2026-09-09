import { IsOptional, IsString, IsInt, IsIn, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class WalletDashboardQueryDto {
    @ApiPropertyOptional({ example: 'silicon' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiPropertyOptional({ example: 10, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit: number = 10;

    @ApiPropertyOptional({
        example: 'vendor_name',
        default: 'vendor_name',
        enum: ['vendor_name', 'wallet_balance', 'total_added', 'total_used', 'last_transaction'],
    })
    @IsOptional()
    @IsString()
    @IsIn(['vendor_name', 'wallet_balance', 'total_added', 'total_used', 'last_transaction'])
    sortBy: string = 'vendor_name';

    @ApiPropertyOptional({ example: 'ASC', default: 'ASC', enum: ['ASC', 'DESC'] })
    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortOrder: 'ASC' | 'DESC' = 'ASC';

    @ApiPropertyOptional({ example: '2026-01-01' })
    @IsOptional()
    @IsString()
    from_date?: string;   // filters last_transaction date

    @ApiPropertyOptional({ example: '2026-03-31' })
    @IsOptional()
    @IsString()
    to_date?: string;

    @ApiPropertyOptional({ example: 1000 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    min_amount?: number;  // filters wallet_balance

    @ApiPropertyOptional({ example: 50000 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    max_amount?: number;
}