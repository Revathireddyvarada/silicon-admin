import { Controller, Get, Patch, Post, Param, Query, Body, UseGuards, Req, Res } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiProduces,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import axios from 'axios';
import { WalletDashboardQueryDto } from './dto/wallet-dashboard.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FastifyRequest, FastifyReply } from 'fastify';

@ApiBearerAuth('JWT-auth')
@ApiTags('admin-wallet')
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    // ─── GET /admin/wallet/dashboard ─────────────────────────────────────────────
    @Get('wallet/dashboard')
    @ApiOperation({ summary: 'Wallet dashboard — summary + paginated vendors' })
    async getWalletDashboard(
        @Req() req: FastifyRequest,
        @Query() query: WalletDashboardQueryDto,
    ) {
        const token = req.headers['authorization'] ?? '';
        return this.walletService.getWalletDashboard(
            token,
            query.search,
            query.page,
            query.limit,
            query.sortBy,
            query.sortOrder,
            query.from_date,
            query.to_date,
            query.min_amount,
            query.max_amount,
        );
    }

    // ─── GET /admin/wallet/summary ───────────────────────────────────────────────
    @Get('wallet/summary')
    @ApiOperation({
        summary: 'Wallet summary cards only',
        description:
            'Lightweight global wallet stats (no vendors list). Prefer this over dashboard for summary tiles.',
    })
    async getWalletSummary(@Req() req: FastifyRequest) {
        const token = req.headers['authorization'] ?? '';
        return this.walletService.getWalletSummary(token);
    }

    // ─── GET /admin/wallet/vendors-cursor ─────────────────────────────────────────
    @Get('wallet/vendors-cursor')
    @ApiOperation({
        summary: 'Wallet vendors list (cursor/keyset)',
        description:
            'Cursor-paginated vendors wallet rows. Use with wallet/summary for summary cards.',
    })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'cursor', required: false })
    @ApiQuery({ name: 'sortBy', required: false })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    @ApiQuery({ name: 'from_date', required: false })
    @ApiQuery({ name: 'to_date', required: false })
    @ApiQuery({ name: 'min_amount', required: false, type: Number })
    @ApiQuery({ name: 'max_amount', required: false, type: Number })
    async getWalletVendorsCursor(
        @Req() req: FastifyRequest,
        @Query('search') search?: string,
        @Query('limit') limit?: number,
        @Query('cursor') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
        @Query('from_date') from_date?: string,
        @Query('to_date') to_date?: string,
        @Query('min_amount') min_amount?: number,
        @Query('max_amount') max_amount?: number,
    ) {
        const token = req.headers['authorization'] ?? '';
        return this.walletService.getWalletVendorsCursor(token, {
            search,
            limit,
            cursor,
            sortBy,
            sortOrder,
            from_date,
            to_date,
            min_amount,
            max_amount,
        });
    }

    // ─── GET /admin/wallet/download ───────────────────────────────────────────────
    @Get('wallet/download')
    @ApiOperation({
        summary: 'Download vendors wallet as CSV (streamed)',
        description: 'Proxies a streamed CSV export from vendor-service.',
    })
    @ApiProduces('text/csv')
    async downloadWallet(
        @Req() req: FastifyRequest,
        @Query() query: WalletDashboardQueryDto,
        @Res() res: FastifyReply,
    ) {
        const token = req.headers['authorization'] ?? '';
        const vendorBase =
            process.env.VENDOR_SERVICE_URL ?? 'http://localhost:3002/api';
        const url = new URL(`${vendorBase}/wallet/admin/vendors/download`);
        if (query.search) url.searchParams.set('search', query.search);
        if (query.from_date) url.searchParams.set('from_date', query.from_date);
        if (query.to_date) url.searchParams.set('to_date', query.to_date);
        if (query.min_amount !== undefined) {
            url.searchParams.set('min_amount', String(query.min_amount));
        }
        if (query.max_amount !== undefined) {
            url.searchParams.set('max_amount', String(query.max_amount));
        }

        try {
            const response = await axios.get(url.toString(), {
                headers: { Authorization: token },
                responseType: 'stream',
                timeout: 0,
                validateStatus: () => true,
            });

            const filename = `vendors-wallet_${new Date().toISOString().slice(0, 10)}.csv`;
            res
                .header('Content-Type', 'text/csv; charset=utf-8')
                .header('Content-Disposition', `attachment; filename="${filename}"`)
                .status(response.status);

            response.data.pipe(res.raw);
        } catch (err) {
            console.error('Proxy wallet CSV download error:', err);
            return res.status(502).send({ message: 'Vendor service unavailable' });
        }
    }

    // ─── GET /admin/vendors/:vendorId/summary ─────────────────────────────────────
    @Get('vendors/:vendorId/summary')
    @ApiOperation({ summary: 'Single vendor wallet stat cards' })
    @ApiParam({ name: 'vendorId', type: String })
    async getVendorSummary(
        @Param('vendorId') vendorId: string,
        @Req() req: FastifyRequest,
    ) {
        const token = req.headers['authorization'] ?? '';
        return this.walletService.getVendorSummary(vendorId, token);
    }

    // ─── POST /admin/vendors/:vendorId/wallet/add-money ───────────────────────────
    @Post('vendors/:vendorId/wallet/add-money')
    @ApiOperation({ summary: 'Manually credit vendor wallet (creates same logs as vendor top-up)' })
    @ApiParam({ name: 'vendorId', type: String })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['amount'],
            properties: {
                amount: { type: 'number', example: 1000, minimum: 1 },
                payment_method: { type: 'string', example: 'Admin' },
                notes: { type: 'string', example: 'Manual top-up' },
            },
        },
    })
    async adminAddVendorMoney(
        @Param('vendorId') vendorId: string,
        @Body() body: { amount: number; payment_method?: string; notes?: string },
        @Req() req: FastifyRequest,
    ) {
        const token = req.headers['authorization'] ?? '';
        return this.walletService.adminAddVendorMoney(vendorId, token, body);
    }

    // ─── GET /admin/vendors/:vendorId/transactions-cursor ─────────────────────────
    @Get('vendors/:vendorId/transactions-cursor')
    @ApiOperation({
        summary: 'Vendor transactions (cursor + last_trips_date)',
        description:
            'Cursor-paginated wallet logs. First page uses vendors.last_trips_date.',
    })
    @ApiParam({ name: 'vendorId', type: String })
    @ApiQuery({ name: 'type', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'payment_method', required: false })
    @ApiQuery({ name: 'from_date', required: false })
    @ApiQuery({ name: 'to_date', required: false })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'cursor', required: false })
    async getVendorTransactionsCursor(
        @Param('vendorId') vendorId: string,
        @Req() req: FastifyRequest,
        @Query('type') type?: string,
        @Query('search') search?: string,
        @Query('payment_method') payment_method?: string,
        @Query('from_date') from_date?: string,
        @Query('to_date') to_date?: string,
        @Query('limit') limit?: number,
        @Query('cursor') cursor?: string,
    ) {
        const token = req.headers['authorization'] ?? '';
        return this.walletService.getVendorTransactionsCursor(vendorId, token, {
            type,
            search,
            payment_method,
            from_date,
            to_date,
            limit,
            cursor,
        });
    }

    // ─── GET /admin/vendors/:vendorId/transactions ────────────────────────────────
    @Get('vendors/:vendorId/transactions')
    @ApiOperation({ summary: 'Single vendor transaction history' })
    @ApiParam({ name: 'vendorId', type: String })
    @ApiQuery({ name: 'type', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'payment_method', required: false })
    @ApiQuery({ name: 'from_date', required: false, example: '2025-12-01' })
    @ApiQuery({ name: 'to_date', required: false, example: '2025-12-31' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getVendorTransactions(
        @Param('vendorId') vendorId: string,
        @Req() req: FastifyRequest,
        @Query('type') type?: string,
        @Query('search') search?: string,
        @Query('payment_method') payment_method?: string,
        @Query('from_date') from_date?: string,
        @Query('to_date') to_date?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        const token = req.headers['authorization'] ?? '';
        return this.walletService.getVendorTransactions(vendorId, token, {
            type, search, payment_method, from_date, to_date, page, limit,
        });
    }
    @Get('vendors/:vendorId/transactions/download')
    @ApiOperation({ summary: 'Download single vendor transactions as CSV' })
    @ApiParam({ name: 'vendorId', type: String })
    @ApiQuery({ name: 'type', required: false, description: 'credit | debit' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'payment_method', required: false })
    @ApiQuery({ name: 'from_date', required: false, example: '2025-12-01' })
    @ApiQuery({ name: 'to_date', required: false, example: '2025-12-31' })
    @ApiProduces('text/csv')
    async downloadVendorTransactions(
        @Param('vendorId') vendorId: string,
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply,
        @Query('type') type?: string,
        @Query('search') search?: string,
        @Query('payment_method') payment_method?: string,
        @Query('from_date') from_date?: string,
        @Query('to_date') to_date?: string,
    ) {
        const token = req.headers['authorization'] ?? '';
        const result = await this.walletService.downloadVendorTransactions(
            vendorId,
            token,
            { type, search, payment_method, from_date, to_date },
        );

        res.header('Content-Type', result.contentType);
        res.header('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(result.data);
    }
    // Must be before wallet/refund-requests/:id
    @Get('wallet/refund-requests-cursor')
    @ApiOperation({
        summary: 'Refund requests (cursor/keyset)',
        description:
            'Cursor-paginated refund requests. Pass meta.nextCursor as cursor for the next page.',
    })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'refund_type', required: false, description: 'General | Trip' })
    @ApiQuery({ name: 'refund_status', required: false, description: 'Requested | Approved | Processing | Refunded' })
    @ApiQuery({ name: 'from_date', required: false, example: '2025-12-01' })
    @ApiQuery({ name: 'to_date', required: false, example: '2025-12-31' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'cursor', required: false })
    async getRefundRequestsCursor(
        @Req() req: FastifyRequest,
        @Query('search') search?: string,
        @Query('refund_type') refund_type?: string,
        @Query('refund_status') refund_status?: string,
        @Query('from_date') from_date?: string,
        @Query('to_date') to_date?: string,
        @Query('limit') limit?: number,
        @Query('cursor') cursor?: string,
    ) {
        const token = req.headers['authorization'] ?? '';
        return this.walletService.getAllRefundRequestsCursor(token, {
            search,
            refund_type,
            refund_status,
            from_date,
            to_date,
            limit,
            cursor,
        });
    }

    @Get('wallet/refund-requests')
    @ApiOperation({ summary: 'All vendor refund requests (Image 1 table)' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'refund_type', required: false, description: 'General | Trip' })
    @ApiQuery({ name: 'refund_status', required: false, description: 'Requested | Approved | Processing | Refunded' })
    @ApiQuery({ name: 'from_date', required: false, example: '2025-12-01' })
    @ApiQuery({ name: 'to_date', required: false, example: '2025-12-31' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getRefundRequests(
        @Req() req: FastifyRequest,
        @Query('search') search?: string,
        @Query('refund_type') refund_type?: string,
        @Query('refund_status') refund_status?: string,
        @Query('from_date') from_date?: string,
        @Query('to_date') to_date?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        const token = req.headers['authorization'] ?? '';
        return this.walletService.getAllRefundRequests(token, {
            search, refund_type, refund_status, from_date, to_date, page, limit,
        });
    }

    // ─── GET /admin/wallet/refund-requests/:id ────────────────────────────────────
    @Get('wallet/refund-requests/:id')
    @ApiOperation({ summary: 'Get a single refund request (for trip/general refund confirm modal)' })
    @ApiParam({ name: 'id', description: 'Refund UUID or RFD-XXXX request_id' })
    async getRefundById(
        @Param('id') id: string,
        @Req() req: FastifyRequest,
    ) {
        const auth = req.headers['authorization'] ?? '';
        const url = `${process.env.VENDOR_SERVICE_URL}/wallet/admin/refund-requests/${id}`;
        console.log("------------------99999------", url);
        try {
            const response = await axios.get(url, {
                headers: { Authorization: auth },
                validateStatus: () => true,
            });
            return response.data;
        } catch (err) {
            console.error('Proxy error:', err);
            throw err;
        }
    }

    // ─── PATCH /admin/wallet/refund-requests/:id ──────────────────────────────────
    @Patch('wallet/refund-requests/:id')
    @ApiOperation({ summary: 'Confirm / update a refund request (general: zero wallet, trip: credit wallet)' })
    @ApiParam({ name: 'id', description: 'Refund UUID or RFD-XXXX request_id' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['status'],
            properties: {
                status: { type: 'string', enum: ['Requested', 'Approved', 'Processing', 'Refunded'] },
                refund_amount: { type: 'number', description: 'Amount in rupees (required for trip refunds)' },
                payment_transaction_id: { type: 'string' },
                description: { type: 'string' },
            },
        },
    })
    async confirmRefund(
        @Param('id') id: string,
        @Body() body: {
            status: string;
            refund_amount?: number;
            payment_transaction_id?: string;
            description?: string;
        },
        @Req() req: FastifyRequest,
    ) {
        const auth = req.headers['authorization'] ?? '';
        const adminId = (req.headers as any)['x-admin-id'] ?? undefined;
        const url = `${process.env.VENDOR_SERVICE_URL}/wallet/admin/refund-requests/${id}`;

        try {
            const response = await axios.patch(url, body, {
                headers: {
                    Authorization: auth,
                    'content-type': 'application/json',
                    ...(adminId && { 'x-admin-id': adminId }),
                },
                validateStatus: () => true,
            });
            return response.data;
        } catch (err) {
            console.error('Proxy error:', err);
            throw err;
        }
    }

    // ─── PATCH /admin/wallet/refund-requests/:id/update-payment ────────────────
    @Patch('wallet/refund-requests/:id/update-payment')
    @ApiOperation({
        summary:
            'Update refund payment (driver mark-payment fields). General: wallet → 0 + wallet_logs.',
    })
    @ApiParam({ name: 'id', description: 'Refund UUID or RFD-XXXX request_id' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['paymentMethod', 'status'],
            properties: {
                paymentMethod: {
                    type: 'string',
                    enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'card', 'net_banking', 'wallet'],
                },
                status: { type: 'string', enum: ['Requested', 'Approved', 'Processing', 'Refunded'] },
                transactionId: { type: 'string' },
                payment_transaction_id: { type: 'string' },
                notes: { type: 'string' },
                description: { type: 'string' },
                payment_related_doc: { type: 'string', nullable: true },
                refund_amount: { type: 'number', description: 'Trip refunds only (rupees)' },
            },
        },
    })
    async markRefundPayment(
        @Param('id') id: string,
        @Body() body: Record<string, unknown>,
        @Req() req: FastifyRequest,
    ) {
        const auth = req.headers['authorization'] ?? '';
        const adminId = (req.headers as any)['x-admin-id'] ?? undefined;
        const url = `${process.env.VENDOR_SERVICE_URL}/wallet/admin/refund-requests/${id}/update-payment`;

        try {
            const response = await axios.patch(url, body, {
                headers: {
                    Authorization: auth,
                    'content-type': 'application/json',
                    ...(adminId && { 'x-admin-id': adminId }),
                },
                validateStatus: () => true,
            });
            return response.data;
        } catch (err) {
            console.error('Proxy error:', err);
            throw err;
        }
    }

    @Get('wallet/refund-requests/download')
    @ApiOperation({ summary: 'Download refund requests as CSV' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'refund_type', required: false })
    @ApiQuery({ name: 'refund_status', required: false })
    @ApiQuery({ name: 'from_date', required: false })
    @ApiQuery({ name: 'to_date', required: false })
    @ApiProduces('text/csv')
    async downloadRefundRequests(
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply,
        @Query('search') search?: string,
        @Query('refund_type') refund_type?: string,
        @Query('refund_status') refund_status?: string,
        @Query('from_date') from_date?: string,
        @Query('to_date') to_date?: string,
    ) {
        const token = req.headers['authorization'] ?? '';
        const result = await this.walletService.downloadRefundRequests(token, {
            search, refund_type, refund_status, from_date, to_date,
        });

        res.header('Content-Type', result.contentType);
        res.header('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(result.data);
    }

    // B2C / Customers — mirror of vendor endpoints but proxied to customer-service
    @Get('b2c/wallet/dashboard')
    @ApiOperation({ summary: 'B2C Wallet dashboard — summary + paginated customers' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'sortBy', required: false })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    @ApiQuery({ name: 'from_date', required: false, example: '2025-12-01' })
    @ApiQuery({ name: 'to_date', required: false, example: '2025-12-31' })
    @ApiQuery({ name: 'min_amount', required: false, type: Number })
    @ApiQuery({ name: 'max_amount', required: false, type: Number })
    async getCustomerDashboard(
        @Req() req: FastifyRequest,
        @Query('search') search?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
        @Query('from_date') from_date?: string,
        @Query('to_date') to_date?: string,
        @Query('min_amount') min_amount?: number,
        @Query('max_amount') max_amount?: number,
    ) {
        const token = req.headers['authorization'] ?? '';
        console.log("helloooooooo");
        
        return this.walletService.getCustomerDashboard(
            token,
            search,
            page,
            limit,
            sortBy,
            sortOrder,
            from_date,
            to_date,
            min_amount,
            max_amount,
        );
    }

    @Get('b2c/wallet/download')
    @ApiOperation({ summary: 'Download customers wallet as CSV' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'from_date', required: false, example: '2025-12-01' })
    @ApiQuery({ name: 'to_date', required: false, example: '2025-12-31' })
    @ApiQuery({ name: 'min_amount', required: false, type: Number })
    @ApiQuery({ name: 'max_amount', required: false, type: Number })
    async downloadCustomerWallet(
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply,
        @Query('search') search?: string,
        @Query('from_date') from_date?: string,
        @Query('to_date') to_date?: string,
        @Query('min_amount') min_amount?: number,
        @Query('max_amount') max_amount?: number,
    ) {
        const token = req.headers['authorization'] ?? '';
        const csv = await this.walletService.downloadCustomerCsv(token, {
            search, from_date, to_date, min_amount, max_amount,
        });

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', `attachment; filename="customers-wallet-${Date.now()}.csv"`);
        res.send(csv);
    }

    @Get('b2c/customers/:customerId/summary')
    @ApiOperation({ summary: 'Single customer wallet stat cards' })
    @ApiParam({ name: 'customerId', type: String })
    async getCustomerSummary(
        @Param('customerId') customerId: string,
        @Req() req: FastifyRequest,
    ) {
        const token = req.headers['authorization'] ?? '';
        return this.walletService.getCustomerSummary(customerId, token);
    }

    @Get('b2c/customers/:customerId/transactions')
    @ApiOperation({ summary: 'Single customer transaction history' })
    @ApiParam({ name: 'customerId', type: String })
    @ApiQuery({ name: 'type', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'payment_method', required: false })
    @ApiQuery({ name: 'from_date', required: false, example: '2025-12-01' })
    @ApiQuery({ name: 'to_date', required: false, example: '2025-12-31' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getCustomerTransactions(
        @Param('customerId') customerId: string,
        @Req() req: FastifyRequest,
        @Query('type') type?: string,
        @Query('search') search?: string,
        @Query('payment_method') payment_method?: string,
        @Query('from_date') from_date?: string,
        @Query('to_date') to_date?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        const token = req.headers['authorization'] ?? '';
        return this.walletService.getCustomerTransactions(customerId, token, {
            type, search, payment_method, from_date, to_date, page, limit,
        });
    }

    @Get('b2c/customers/:customerId/transactions/download')
    @ApiOperation({ summary: 'Download single customer transactions as CSV' })
    @ApiParam({ name: 'customerId', type: String })
    @ApiQuery({ name: 'type', required: false, description: 'credit | debit' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'payment_method', required: false })
    @ApiQuery({ name: 'from_date', required: false, example: '2025-12-01' })
    @ApiQuery({ name: 'to_date', required: false, example: '2025-12-31' })
    @ApiProduces('text/csv')
    async downloadCustomerTransactions(
        @Param('customerId') customerId: string,
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply,
        @Query('type') type?: string,
        @Query('search') search?: string,
        @Query('payment_method') payment_method?: string,
        @Query('from_date') from_date?: string,
        @Query('to_date') to_date?: string,
    ) {
        const token = req.headers['authorization'] ?? '';
        const result = await this.walletService.downloadCustomerTransactions(
            customerId,
            token,
            { type, search, payment_method, from_date, to_date },
        );

        res.header('Content-Type', result.contentType);
        res.header('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(result.data);
    }

    @Get('b2c/wallet/refund-requests')
    @ApiOperation({ summary: 'All customer refund requests' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'refund_type', required: false, description: 'General | Trip' })
    @ApiQuery({ name: 'refund_status', required: false, description: 'Requested | Approved | Processing | Refunded' })
    @ApiQuery({ name: 'from_date', required: false, example: '2025-12-01' })
    @ApiQuery({ name: 'to_date', required: false, example: '2025-12-31' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getCustomerRefundRequests(
        @Req() req: FastifyRequest,
        @Query('search') search?: string,
        @Query('refund_type') refund_type?: string,
        @Query('refund_status') refund_status?: string,
        @Query('from_date') from_date?: string,
        @Query('to_date') to_date?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        const token = req.headers['authorization'] ?? '';
        return this.walletService.getAllCustomerRefundRequests(token, {
            search, refund_type, refund_status, from_date, to_date, page, limit,
        });
    }

    @Get('b2c/wallet/refund-requests/:id')
    @ApiOperation({ summary: 'Get a single customer refund request' })
    @ApiParam({ name: 'id', description: 'Refund UUID or RFD-XXXX request_id' })
    async getCustomerRefundById(
        @Param('id') id: string,
        @Req() req: FastifyRequest,
    ) {
        const auth = req.headers['authorization'] ?? '';
        const url = `${process.env.CUSTOMER_SERVICE_URL}/wallet/admin/refund-requests/${id}`;
        try {
            const response = await axios.get(url, {
                headers: { Authorization: auth },
                validateStatus: () => true,
            });
            return response.data;
        } catch (err) {
            console.error('Proxy error:', err);
            throw err;
        }
    }

    @Patch('b2c/wallet/refund-requests/:id')
    @ApiOperation({ summary: 'Confirm / update a customer refund request' })
    @ApiParam({ name: 'id', description: 'Refund UUID or RFD-XXXX request_id' })
    async confirmCustomerRefund(
        @Param('id') id: string,
        @Body() body: {
            status: string;
            refund_amount?: number;
            payment_transaction_id?: string;
            description?: string;
        },
        @Req() req: FastifyRequest,
    ) {
        const auth = req.headers['authorization'] ?? '';
        const adminId = (req.headers as any)['x-admin-id'] ?? undefined;
        const url = `${process.env.CUSTOMER_SERVICE_URL}/wallet/admin/refund-requests/${id}`;

        try {
            const response = await axios.patch(url, body, {
                headers: {
                    Authorization: auth,
                    'content-type': 'application/json',
                    ...(adminId && { 'x-admin-id': adminId }),
                },
                validateStatus: () => true,
            });
            return response.data;
        } catch (err) {
            console.error('Proxy error:', err);
            throw err;
        }
    }

    @Get('b2c/wallet/refund-requests/download')
    @ApiOperation({ summary: 'Download customer refund requests as CSV' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'refund_type', required: false })
    @ApiQuery({ name: 'refund_status', required: false })
    @ApiQuery({ name: 'from_date', required: false })
    @ApiQuery({ name: 'to_date', required: false })
    @ApiProduces('text/csv')
    async downloadCustomerRefundRequests(
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply,
        @Query('search') search?: string,
        @Query('refund_type') refund_type?: string,
        @Query('refund_status') refund_status?: string,
        @Query('from_date') from_date?: string,
        @Query('to_date') to_date?: string,
    ) {
        const token = req.headers['authorization'] ?? '';
        const result = await this.walletService.downloadCustomerRefundRequests(token, {
            search, refund_type, refund_status, from_date, to_date,
        });

        res.header('Content-Type', result.contentType);
        res.header('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(result.data);
    }
}