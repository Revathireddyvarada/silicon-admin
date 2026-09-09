import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import axios from 'axios';
import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const VENDOR_SERVICE_URL = process.env.VENDOR_SERVICE_URL ?? 'http://localhost:3002/api';
const DRIVER_SERVICE_URL = process.env.DRIVER_SERVICE_URL ?? 'http://localhost:3004/api';
const RIDE_SERVICE_URL = process.env.RIDE_SERVICE_URL ?? 'http://localhost:3006/api';

@ApiTags('admin-dashboard')
@ApiBearerAuth('JWT-auth')
@Controller(['admin-dashboard', 'web-admin/admin-dashboard'])
@UseGuards(JwtAuthGuard)
export class AdminDashboardController {
  
  @Get('refund-requests')
  @ApiOperation({ summary: 'Get refund requests for dashboard' })
  @ApiResponse({ status: 200, description: 'Refund requests retrieved successfully' })
  @ApiQuery({ name: 'period', enum: ['today', 'yesterday', 'week', 'month', 'custom'], required: true })
  @ApiQuery({ name: 'from_date', required: false, type: String })
  @ApiQuery({ name: 'to_date', required: false, type: String })
  async getRefundRequests(
    @Req() req: FastifyRequest, 
    @Res() res: FastifyReply,
    @Query('period') period?: string,
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string
  ) {
    try {
      const url = `${VENDOR_SERVICE_URL}/admin-dashboard/refund-requests`;
      const response = await axios.get(url, {
        headers: { Authorization: req.headers.authorization || '' },
        params: { period, from_date, to_date },
        validateStatus: () => true,
      });
      return res.status(response.status).send(response.data);
    } catch (err) {
      return res.status(502).send({ message: 'Vendor service unavailable' });
    }
  }

  @Get('kyc-approvals')
  @ApiOperation({ summary: 'Get pending KYC approvals for dashboard' })
  @ApiResponse({ status: 200, description: 'KYC approvals retrieved successfully' })
  @ApiQuery({ name: 'period', enum: ['today', 'yesterday', 'week', 'month', 'custom'], required: true })
  @ApiQuery({ name: 'from_date', required: false, type: String })
  @ApiQuery({ name: 'to_date', required: false, type: String })
  async getKycApprovals(
    @Req() req: FastifyRequest, 
    @Res() res: FastifyReply,
    @Query('period') period?: string,
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string
  ) {
    try {
      const url = `${DRIVER_SERVICE_URL}/admin-dashboard/kyc-approvals`;
      const response = await axios.get(url, {
        headers: { Authorization: req.headers.authorization || '' },
        params: { period, from_date, to_date },
        validateStatus: () => true,
      });
      return res.status(response.status).send(response.data);
    } catch (err) {
      return res.status(502).send({ message: 'Driver service unavailable' });
    }
  }

  @Get('vehicle-insights')
  @ApiOperation({ summary: 'Get vehicle insights for dashboard' })
  @ApiResponse({ status: 200, description: 'Vehicle insights retrieved successfully' })
  @ApiQuery({ name: 'period', enum: ['today', 'yesterday', 'week', 'month', 'custom'], required: true })
  @ApiQuery({ name: 'from_date', required: false, type: String })
  @ApiQuery({ name: 'to_date', required: false, type: String })
  async getVehicleInsights(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Query('period') period?: string,
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string
  ) {
    try {
      const headers = { Authorization: req.headers.authorization || '' };
      const params = { period, from_date, to_date };

      // Insurance expiries are an alert list (driver-service, period-agnostic);
      // vehicle type usage reflects trips actually run in the period (ride-service).
      const [insuranceRes, usageRes] = await Promise.all([
        axios.get(`${DRIVER_SERVICE_URL}/admin-dashboard/vehicle-insights`, { headers, params, validateStatus: () => true }),
        axios.get(`${RIDE_SERVICE_URL}/admin-dashboard/vehicle-usage`, { headers, params, validateStatus: () => true }),
      ]);

      // driver-service wraps every response in its own {success,data} envelope
      // on top of the global {success,statusCode,message,data} interceptor —
      // ride-service has no such interceptor, so it needs one less hop.
      const insurances = insuranceRes.data?.data?.data?.insurances ?? [];
      const usage = usageRes.data?.data ?? [];

      return res.status(200).send({
        success: true,
        data: { insurances, usage },
      });
    } catch (err) {
      return res.status(502).send({ message: 'Driver or ride service unavailable' });
    }
  }

  @Get('trip-daily-totals')
  @ApiOperation({
    summary: 'Per-day created / completed / cancelled / pending counts from the ride-service rollup',
  })
  @ApiResponse({ status: 200, description: 'Daily trip totals retrieved successfully' })
  @ApiQuery({ name: 'period', enum: ['today', 'yesterday', 'week', 'month', 'custom'], required: true })
  @ApiQuery({ name: 'from_date', required: false, type: String })
  @ApiQuery({ name: 'to_date', required: false, type: String })
  async getDailyTripTotals(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Query('period') period?: string,
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string
  ) {
    try {
      const url = `${RIDE_SERVICE_URL}/admin-dashboard/trip-daily-totals`;
      const response = await axios.get(url, {
        headers: { Authorization: req.headers.authorization || '' },
        params: { period, from_date, to_date },
        validateStatus: () => true,
      });
      return res.status(response.status).send(response.data);
    } catch (err) {
      return res.status(502).send({ message: 'Ride service unavailable' });
    }
  }

  @Get('trips-by-time-slot')
  @ApiOperation({ summary: 'Get trips by time slot for dashboard' })
  @ApiResponse({ status: 200, description: 'Trips by time slot retrieved successfully' })
  @ApiQuery({ name: 'period', enum: ['today', 'yesterday', 'week', 'month', 'custom'], required: true })
  @ApiQuery({ name: 'from_date', required: false, type: String })
  @ApiQuery({ name: 'to_date', required: false, type: String })
  async getTripsByTimeSlot(
    @Req() req: FastifyRequest, 
    @Res() res: FastifyReply,
    @Query('period') period?: string,
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string
  ) {
    try {
      const url = `${RIDE_SERVICE_URL}/admin-dashboard/trips-by-time-slot`;
      const response = await axios.get(url, {
        headers: { Authorization: req.headers.authorization || '' },
        params: { period, from_date, to_date },
        validateStatus: () => true,
      });
      return res.status(response.status).send(response.data);
    } catch (err) {
      return res.status(502).send({ message: 'Ride service unavailable' });
    }
  }

  @Get('transaction-overview')
  @ApiOperation({ summary: 'Get transaction overview for dashboard' })
  @ApiResponse({ status: 200, description: 'Transaction overview retrieved successfully' })
  @ApiQuery({ name: 'period', enum: ['today', 'yesterday', 'week', 'month', 'custom'], required: true })
  @ApiQuery({ name: 'from_date', required: false, type: String })
  @ApiQuery({ name: 'to_date', required: false, type: String })
  async getTransactionOverview(
    @Req() req: FastifyRequest, 
    @Res() res: FastifyReply,
    @Query('period') period?: string,
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string
  ) {
    try {
      const url = `${VENDOR_SERVICE_URL}/admin-dashboard/transaction-overview`;
      const response = await axios.get(url, {
        headers: { Authorization: req.headers.authorization || '' },
        params: { period, from_date, to_date },
        validateStatus: () => true,
      });
      return res.status(response.status).send(response.data);
    } catch (err) {
      return res.status(502).send({ message: 'Service unavailable' });
    }
  }

  @Get('get-main-stats')
  @ApiOperation({ summary: 'Get combined high-level dashboard stats' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  @ApiQuery({ name: 'period', enum: ['today', 'yesterday', 'week', 'month', 'custom'], required: true })
  @ApiQuery({ name: 'from_date', required: false, type: String })
  @ApiQuery({ name: 'to_date', required: false, type: String })
  async getMainStats(
    @Req() req: FastifyRequest, 
    @Res() res: FastifyReply,
    @Query('period') period?: string,
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string
  ) {
    try {
      const headers = { Authorization: req.headers.authorization || '' };
      const params = { period, from_date, to_date };

      const [rideStatsRes, vendorStatsRes] = await Promise.all([
        axios.get(`${RIDE_SERVICE_URL}/admin-dashboard/stats`, { headers, params }).catch(() => ({ data: { data: {} } })),
        axios.get(`${VENDOR_SERVICE_URL}/admin-dashboard/transaction-overview`, { headers, params }).catch(() => ({ data: { data: {} } })),
      ]);

      // vendor-service wraps responses in its own {success,data} envelope on top
      // of the global interceptor; ride-service does not, so it needs one less
      // hop (see getVehicleInsights above).
      const r = rideStatsRes.data.data || {};
      const v = vendorStatsRes.data.data?.data || {};

      return res.status(200).send({
        success: true,
        data: {
          completedTrips: r.completedTrips || 0,
          earnedAmount: v.credit || 0,
          avgPerTrip: r.avgPerTrip || 0,
          pendingTrips: r.pendingTrips || 0,
          cancelTrips: r.cancelTrips || 0,
          todayTrips: r.todayTrips || 0,
          ongoingTrips: r.ongoingTrips || 0,
        }
      });
    } catch (err) {
      return res.status(500).send({ message: 'Internal server error' });
    }
  }

  @Get('driver-insights')
  @ApiOperation({ summary: 'Get driver insights' })
  @ApiResponse({ status: 200, description: 'Driver insights retrieved successfully' })
  @ApiQuery({ name: 'period', enum: ['today', 'yesterday', 'week', 'month', 'custom'], required: true })
  @ApiQuery({ name: 'from_date', required: false, type: String })
  @ApiQuery({ name: 'to_date', required: false, type: String })
  async getDriverInsights(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Query('period') period?: string,
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string
  ) {
    try {
      const headers = { Authorization: req.headers.authorization || '' };
      const params = { period, from_date, to_date };

      // Ratings come from reviews (driver-service); topDrivers is trip counts
      // per driver in the period, which lives in ride-service's trips table.
      const [ratingsRes, topDriversRes] = await Promise.all([
        axios.get(`${DRIVER_SERVICE_URL}/admin-dashboard/driver-insights`, { headers, params, validateStatus: () => true }),
        axios.get(`${RIDE_SERVICE_URL}/admin-dashboard/trips-per-driver`, { headers, params, validateStatus: () => true }),
      ]);

      // driver-service double-wraps (see getVehicleInsights); ride-service doesn't.
      const ratings = ratingsRes.data?.data?.data?.ratings ?? { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      const topDrivers = topDriversRes.data?.data ?? [];

      return res.status(200).send({
        success: true,
        data: { ratings, topDrivers },
      });
    } catch (err) {
      return res.status(502).send({ message: 'Driver or ride service unavailable' });
    }
  }

  @Get('employee-insights')
  @ApiOperation({ summary: 'Get employee insights' })
  @ApiResponse({ status: 200, description: 'Employee insights retrieved successfully' })
  @ApiQuery({ name: 'period', enum: ['today', 'yesterday', 'week', 'month', 'custom'], required: true })
  @ApiQuery({ name: 'from_date', required: false, type: String })
  @ApiQuery({ name: 'to_date', required: false, type: String })
  async getEmployeeInsights(
    @Req() req: FastifyRequest, 
    @Res() res: FastifyReply,
    @Query('period') period?: string,
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string
  ) {
    try {
      const url = `${RIDE_SERVICE_URL}/admin-dashboard/employee-insights`;
      const response = await axios.get(url, {
        headers: { Authorization: req.headers.authorization || '' },
        params: { period, from_date, to_date },
        validateStatus: () => true,
      });
      return res.status(response.status).send(response.data);
    } catch (err) {
      return res.status(502).send({ message: 'Ride service unavailable' });
    }
  }
}
