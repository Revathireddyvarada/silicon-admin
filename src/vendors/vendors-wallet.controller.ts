import { Controller, Get, Req, Res, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiProduces, ApiOkResponse } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import axios from 'axios';

const VENDOR_SERVICE_URL = process.env.VENDOR_SERVICE_URL ?? 'http://localhost:3002/api';

@ApiTags('vendors-wallet')
// @ApiBearerAuth('JWT-auth')
@Controller('vendors/wallet')
export class VendorsWalletController {
  @Get('stats')
  @ApiOperation({ summary: 'Get overall wallet stats (Proxy to vendor-service)' })
  async getWalletStats(@Req() req: any, @Res() res: FastifyReply) {
    const authHeader = req.headers['authorization'] as string | undefined;
    const url = `${VENDOR_SERVICE_URL}/admin/wallet/stats`;

    try {
      const response = await axios.get(url, {
        headers: { Authorization: authHeader ?? '' },
        validateStatus: () => true,
      });
      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error('Proxy error:', err);
      return res.status(502).send({ message: 'Vendor service unavailable' });
    }
  }
  @Get()
  @ApiOperation({ summary: 'Get all vendors with wallet details (Proxy)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getVendorsWallet(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const authHeader = req.headers['authorization'] as string | undefined;
    const url = new URL(`${VENDOR_SERVICE_URL}/admin/wallet/vendors`);

    if (search) url.searchParams.set('search', search);
    if (page) url.searchParams.set('page', String(page));
    if (limit) url.searchParams.set('limit', String(limit));

    try {
      const response = await axios.get(url.toString(), {
        headers: { Authorization: authHeader ?? '' },
        validateStatus: () => true,
      });
      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error('Proxy error:', err);
      return res.status(502).send({ message: 'Vendor service unavailable' });
    }
  }
  @Get('download')
  @ApiOperation({ summary: 'Download vendors wallet data as Excel (Proxy)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiOkResponse({
    description: 'Excel file download',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  async downloadVendorsWallet(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Query('search') search?: string,
  ) {
    const authHeader = req.headers['authorization'] as string | undefined;
    const url = new URL(`${VENDOR_SERVICE_URL}/admin/wallet/vendors/download`);

    if (search) url.searchParams.set('search', search);

    try {
      const response = await axios.get(url.toString(), {
        headers: { Authorization: authHeader ?? '' },
        responseType: 'arraybuffer',
        validateStatus: () => true,
      });

      res.header('Content-Type', response.headers['content-type']);
      res.header('Content-Disposition', response.headers['content-disposition']);

      return res.status(response.status).send(response.data);
    } catch (err) {
      console.error('Proxy EXPORT error:', err);
      return res.status(502).send({ message: 'Vendor service unavailable' });
    }
  }
}
