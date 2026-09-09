// import { Controller, Get, Patch, Param, Body, Query, Req, Res, UseGuards } from '@nestjs/common';
// import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader, ApiProduces, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
// import { FastifyReply } from 'fastify';
// import axios from 'axios';
// // If JwtAuthGuard is used, import it, but usually these are protected by APP_GUARD
// // import { JwtAuthGuard } from '../guards/jwt-auth.guard';

// const VENDOR_SERVICE_URL = process.env.VENDOR_SERVICE_URL ?? 'http://localhost:3002/api';
// const CUSTOMER_SERVICE_URL = process.env.CUSTOMER_SERVICE_URL ?? 'http://localhost:3005/api';

// @ApiTags('refunds')
// @ApiBearerAuth('JWT-auth')
// @Controller(['refunds', 'web-admin/refunds'])
// export class RefundsController {

//   @Get()
//   @ApiOperation({ summary: 'Get all vendor refund requests (Proxy to vendor-service)' })
//   @ApiQuery({ name: 'search', required: false })
//   @ApiQuery({ name: 'status', required: false })
//   @ApiQuery({ name: 'page', required: false, type: Number })
//   @ApiQuery({ name: 'limit', required: false, type: Number })
//   async getAllRefundRequests(
//     @Req() req: any,
//     @Res() res: FastifyReply,
//     @Query('search') search?: string,
//     @Query('status') status?: string,
//     @Query('page') page?: number,
//     @Query('limit') limit?: number,
//   ) {

//     const authHeader = req.headers['authorization'] as string | undefined;
//     const url = new URL(`${VENDOR_SERVICE_URL}/wallet/admin/refund-requests`);
//     console.log("------------------------", url);

//     if (search) url.searchParams.set('search', search);
//     if (status) url.searchParams.set('status', status);
//     if (page) url.searchParams.set('page', String(page));
//     if (limit) url.searchParams.set('limit', String(limit));

//     try {
//       const authHeader = req.headers['authorization'] as string | undefined;
//       const response = await axios.get(url.toString(), {
//         headers: { Authorization: authHeader ?? '' },
//         validateStatus: () => true,
//       });
//       return res.status(response.status).send(response.data);
//     } catch (err: any) {
//       console.error('Proxy error:', err);
//       return res.status(502).send({ message: 'Vendor service unavailable' });
//     }
//   }

//   @Patch(':id')
//   @ApiOperation({ summary: 'Update vendor refund request status (Proxy)' })
//   @ApiHeader({ name: 'x-admin-id', required: false })
//   async updateRefundRequest(
//     @Req() req: any,
//     @Res() res: FastifyReply,
//     @Param('id') id: string,
//     @Body() body: any,
//   ) {
//     const authHeader = req.headers['authorization'] as string | undefined;
//     const adminId = req.headers['x-admin-id'] as string | undefined;
//     const url = `${VENDOR_SERVICE_URL}/wallet/admin/refund-requests/${id}`;
//     try {
//       console.log("-------++++++----", url);

//       const authHeader = req.headers['authorization'] as string | undefined;
//       const response = await axios.patch(url, body, {
//         headers: {
//           Authorization: authHeader ?? '',
//           'content-type': 'application/json',
//           ...(adminId && { 'x-admin-id': adminId }),
//         },
//         validateStatus: () => true,
//       });

//       return res.status(response.status).send(response.data);
//     } catch (err: any) {
//       console.error('Proxy error:', err);
//       return res.status(502).send({ message: 'Vendor service unavailable' });
//     }
//   }

//   @Get('download')
//   @ApiOperation({ summary: 'Download refund requests as Excel (Proxy)' })
//   @ApiQuery({ name: 'search', required: false })
//   @ApiQuery({ name: 'status', required: false })
//   @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
//   @ApiOkResponse({
//     description: 'Excel file download',
//     content: {
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
//         schema: { type: 'string', format: 'binary' },
//       },
//     },
//   })
//   async downloadRefundRequests(
//     @Req() req: any,
//     @Res() res: FastifyReply,
//     @Query('search') search?: string,
//     @Query('status') status?: string,
//   ) {
//     const authHeader = req.headers['authorization'] as string | undefined;
//     const url = new URL(`${VENDOR_SERVICE_URL}/wallet/admin/refund-requests/download`);

//     if (search) url.searchParams.set('search', search);
//     if (status) url.searchParams.set('status', status);

//     try {
//       const authHeader = req.headers['authorization'] as string | undefined;
//       const response = await axios.get(url.toString(), {
//         headers: { Authorization: authHeader ?? '' },
//         responseType: 'arraybuffer',
//         validateStatus: () => true,
//       });

//       res.header('Content-Type', response.headers['content-type']);
//       res.header('Content-Disposition', response.headers['content-disposition']);

//       return res.status(response.status).send(response.data);
//     } catch (err: any) {
//       console.error('Proxy EXPORT error:', err);
//       return res.status(502).send({ message: 'Vendor service unavailable' });
//     }
//   }

//   // B2C / Customer

//   @Get('b2c')
//   @ApiOperation({ summary: 'Get all customer refund requests (Proxy to customer-service)' })
//   @ApiQuery({ name: 'search', required: false })
//   @ApiQuery({ name: 'status', required: false })
//   @ApiQuery({ name: 'page', required: false, type: Number })
//   @ApiQuery({ name: 'limit', required: false, type: Number })
//   async getAllCustomerRefundRequests(
//     @Req() req: any,
//     @Res() res: FastifyReply,
//     @Query('search') search?: string,
//     @Query('status') status?: string,
//     @Query('page') page?: number,
//     @Query('limit') limit?: number,
//   ) {
//     const url = new URL(`${CUSTOMER_SERVICE_URL}/wallet/admin/refund-requests`);
//     if (search) url.searchParams.set('search', search);
//     if (status) url.searchParams.set('status', status);
//     if (page) url.searchParams.set('page', String(page));
//     if (limit) url.searchParams.set('limit', String(limit));
//     console.log("------------------------", url);


//     try {
//       const authHeader = req.headers['authorization'] as string | undefined;
//       const response = await axios.get(url.toString(), {
//         headers: { Authorization: authHeader ?? '' },
//         validateStatus: () => true,
//       });
//       return res.status(response.status).send(response.data);
//     } catch (err: any) {
//       console.error('Proxy error (customer-service):', err?.response?.status, err?.response?.data || err.message);
//       return res.status(502).send({ message: 'Customer service unavailable' });
//     }
//   }

//   @Patch('b2c/:id')
//   @ApiOperation({ summary: 'Update customer refund request status (Proxy)' })
//   @ApiHeader({ name: 'x-admin-id', required: false })
//   async updateCustomerRefundRequest(
//     @Req() req: any,
//     @Res() res: FastifyReply,
//     @Param('id') id: string,
//     @Body() body: any,
//   ) {
//     const adminId = req.headers['x-admin-id'] as string | undefined;
//     const url = `${CUSTOMER_SERVICE_URL}/wallet/admin/refund-requests/${id}`;
//     console.log("------------------------", url);

//     try {
//       const authHeader = req.headers['authorization'] as string | undefined;
//       const response = await axios.patch(url, body, {
//         headers: {
//           Authorization: authHeader ?? '',
//           'content-type': 'application/json',
//           ...(adminId && { 'x-admin-id': adminId }),
//         },
//         validateStatus: () => true,
//       });
//       return res.status(response.status).send(response.data);
//     } catch (err: any) {
//       console.error('Proxy error (customer-service):', err);
//       return res.status(502).send({ message: 'Customer service unavailable' });
//     }
//   }

//   @Get('b2c/download')
//   @ApiOperation({ summary: 'Download customer refund requests as Excel (Proxy)' })
//   @ApiQuery({ name: 'search', required: false })
//   @ApiQuery({ name: 'status', required: false })
//   @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
//   async downloadCustomerRefundRequests(
//     @Req() req: any,
//     @Res() res: FastifyReply,
//     @Query('search') search?: string,
//     @Query('status') status?: string,
//   ) {
//     const url = new URL(`${CUSTOMER_SERVICE_URL}/wallet/admin/refund-requests/download`);
//     console.log("------------------------", url);

//     if (search) url.searchParams.set('search', search);
//     if (status) url.searchParams.set('status', status);

//     try {
//       const authHeader = req.headers['authorization'] as string | undefined;
//       const response = await axios.get(url.toString(), {
//         headers: { Authorization: authHeader ?? '' },
//         responseType: 'arraybuffer',
//         validateStatus: () => true,
//       });

//       res.header('Content-Type', response.headers['content-type']);
//       res.header('Content-Disposition', response.headers['content-disposition']);

//       return res.status(response.status).send(response.data);
//     } catch (err: any) {
//       console.error('Proxy EXPORT error (customer-service):', err);
//       return res.status(502).send({ message: 'Customer service unavailable' });
//     }
//   }
// }
