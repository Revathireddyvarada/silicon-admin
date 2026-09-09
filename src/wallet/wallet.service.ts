import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { log } from 'console';

@Injectable()
export class WalletService {
    private VENDOR_SERVICE_URL = process.env.VENDOR_SERVICE_URL;
    private CUSTOMER_SERVICE_URL = process.env.CUSTOMER_SERVICE_URL;

    async getWalletDashboard(
        token: string,
        search?: string,
        page: number = 1,
        limit: number = 10,
        sortBy: string = 'vendor_name',
        sortOrder: 'ASC' | 'DESC' = 'ASC',
        from_date?: string,
        to_date?: string,
        min_amount?: number,
        max_amount?: number,
    ) {
        const headers = { Authorization: token };

        const vendorParams: Record<string, any> = { page, limit, sortBy, sortOrder };
        if (search?.trim()) vendorParams.search = search.trim();
        if (from_date) vendorParams.from_date = from_date;
        if (to_date) vendorParams.to_date = to_date;
        if (min_amount !== undefined) vendorParams.min_amount = min_amount;
        if (max_amount !== undefined) vendorParams.max_amount = max_amount;

        const [summary, vendors] = await Promise.all([
            axios.get(`${this.VENDOR_SERVICE_URL}/wallet/admin/summary`, { headers }),
            axios.get(`${this.VENDOR_SERVICE_URL}/wallet/admin/vendors`, { headers, params: vendorParams }),
        ]);

        return { ...summary.data, vendors: vendors.data };
    }

    async getWalletVendorsCursor(
        token: string,
        query: {
            search?: string;
            limit?: number;
            cursor?: string;
            sortBy?: string;
            sortOrder?: 'ASC' | 'DESC';
            from_date?: string;
            to_date?: string;
            min_amount?: number;
            max_amount?: number;
        },
    ) {
        try {
            const headers = { Authorization: token };
            const params: Record<string, any> = {};
            if (query.search?.trim()) params.search = query.search.trim();
            if (query.limit !== undefined) params.limit = query.limit;
            if (query.cursor?.trim()) params.cursor = query.cursor.trim();
            if (query.sortBy) params.sortBy = query.sortBy;
            if (query.sortOrder) params.sortOrder = query.sortOrder;
            if (query.from_date) params.from_date = query.from_date;
            if (query.to_date) params.to_date = query.to_date;
            if (query.min_amount !== undefined) params.min_amount = query.min_amount;
            if (query.max_amount !== undefined) params.max_amount = query.max_amount;

            const res = await axios.get(
                `${this.VENDOR_SERVICE_URL}/wallet/admin/vendors-cursor`,
                { headers, params },
            );
            return res.data;
        } catch (error: any) {
            throw new HttpException(
                error?.response?.data?.message ||
                    error.message ||
                    'Failed to load vendor wallets',
                error?.response?.status || HttpStatus.BAD_GATEWAY,
            );
        }
    }

    async getWalletSummary(token: string) {
        try {
            const headers = { Authorization: token };
            const res = await axios.get(
                `${this.VENDOR_SERVICE_URL}/wallet/admin/summary`,
                { headers },
            );
            return res.data;
        } catch (error: any) {
            throw new HttpException(
                error?.response?.data?.message ||
                    error.message ||
                    'Failed to load wallet summary',
                error?.response?.status || HttpStatus.BAD_GATEWAY,
            );
        }
    }

    async downloadWalletCsv(token: string, query: Record<string, any>): Promise<Buffer> {
        const headers = { Authorization: token };
        const response = await axios.get(
            `${this.VENDOR_SERVICE_URL}/wallet/admin/vendors/download`,
            { headers, params: query, responseType: 'arraybuffer' },
        );
        return Buffer.from(response.data);
    }

    async getVendorSummary(vendorId: string, token: string) {
        const res = await axios.get(
            `${this.VENDOR_SERVICE_URL}/wallet/vendors/${vendorId}/summary`,
            { headers: { Authorization: token } },
        );
        return res.data;
    }

    async adminAddVendorMoney(
        vendorId: string,
        token: string,
        body: { amount: number; payment_method?: string; notes?: string },
    ) {
        try {
            const res = await axios.post(
                `${this.VENDOR_SERVICE_URL}/wallet/admin/vendors/${vendorId}/add-money`,
                body,
                { headers: { Authorization: token } },
            );
            return res.data;
        } catch (error: any) {
            throw new HttpException(
                error?.response?.data?.message || error.message || 'Failed to add wallet amount',
                error?.response?.status || HttpStatus.BAD_GATEWAY,
            );
        }
    }

    async getVendorTransactions(
        vendorId: string,
        token: string,
        query: {
            type?: string;
            search?: string;
            payment_method?: string;
            from_date?: string;
            to_date?: string;
            page?: number;
            limit?: number;
        },
    ) {
        const res = await axios.get(
            `${this.VENDOR_SERVICE_URL}/wallet/vendors/${vendorId}/transactions`,
            { headers: { Authorization: token }, params: query },
        );
        return res.data;
    }

    async getVendorTransactionsCursor(
        vendorId: string,
        token: string,
        query: {
            type?: string;
            search?: string;
            payment_method?: string;
            from_date?: string;
            to_date?: string;
            limit?: number;
            cursor?: string;
        },
    ) {
        try {
            const res = await axios.get(
                `${this.VENDOR_SERVICE_URL}/wallet/vendors/${vendorId}/transactions-cursor`,
                { headers: { Authorization: token }, params: query },
            );
            return res.data;
        } catch (error: any) {
            throw new HttpException(
                error?.response?.data?.message ||
                    error.message ||
                    'Failed to load vendor transactions',
                error?.response?.status || HttpStatus.BAD_GATEWAY,
            );
        }
    }

    async downloadVendorTransactions(
        vendorId: string,
        token: string,
        query: {
            type?: string;
            search?: string;
            payment_method?: string;
            from_date?: string;
            to_date?: string;
        },
    ): Promise<{ data: Buffer; contentType: string; filename: string }> {
        const res = await axios.get(
            `${this.VENDOR_SERVICE_URL}/wallet/vendors/${vendorId}/transactions/download`,
            {
                headers: { Authorization: token },
                params: query,
                responseType: 'arraybuffer',  // important — get raw bytes not string
            },
        );

        return {
            data: Buffer.from(res.data),
            // contentType: res.headers['content-type'] ?? 'text/csv',
            contentType: (res.headers['content-type'] as string) ?? 'text/csv',
            filename: `transactions-${vendorId}-${Date.now()}.csv`,
        };
    }
    async getAllRefundRequests(token: string, query: {
        search?: string;
        refund_type?: string;
        refund_status?: string;
        from_date?: string;
        to_date?: string;
        page?: number;
        limit?: number;
    }) {
        const res = await axios.get(
            `${this.VENDOR_SERVICE_URL}/wallet/admin/refund-requests`,
            {
                headers: { Authorization: token },
                params: query,
            },
        );
        return res.data;
    }

    async getAllRefundRequestsCursor(
        token: string,
        query: {
            search?: string;
            refund_type?: string;
            refund_status?: string;
            from_date?: string;
            to_date?: string;
            limit?: number;
            cursor?: string;
        },
    ) {
        if (!this.VENDOR_SERVICE_URL?.trim()) {
            throw new HttpException(
                'VENDOR_SERVICE_URL is not configured in admin-service',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        const base = this.VENDOR_SERVICE_URL.replace(/\/$/, '');
        const headers = { Authorization: token };
        const params: Record<string, any> = {};
        if (query.search?.trim()) params.search = query.search.trim();
        if (query.refund_type) params.refund_type = query.refund_type;
        if (query.refund_status) params.refund_status = query.refund_status;
        if (query.from_date) params.from_date = query.from_date;
        if (query.to_date) params.to_date = query.to_date;
        if (query.limit !== undefined) params.limit = query.limit;
        if (query.cursor?.trim()) params.cursor = query.cursor.trim();

        try {
            const res = await axios.get(
                `${base}/wallet/admin/refund-requests-cursor`,
                { headers, params, timeout: 30000 },
            );
            return res.data;
        } catch (error: any) {
            const status = error?.response?.status as number | undefined;
            const upstream =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message;

            // Cursor route missing on older vendor builds → fall back to page list
            if (status === 404 && !query.cursor?.trim()) {
                try {
                    const pageRes = await axios.get(
                        `${base}/wallet/admin/refund-requests`,
                        {
                            headers,
                            params: {
                                ...params,
                                page: 1,
                                limit: query.limit ?? 10,
                            },
                            timeout: 30000,
                        },
                    );
                    const body = pageRes.data ?? {};
                    const rows = Array.isArray(body?.data)
                        ? body.data
                        : Array.isArray(body)
                          ? body
                          : [];
                    return {
                        data: rows,
                        meta: {
                            limit: Number(query.limit) || 10,
                            nextCursor: null,
                            hasNextPage: false,
                            hasPrevPage: false,
                        },
                    };
                } catch (fallbackErr: any) {
                    throw new HttpException(
                        fallbackErr?.response?.data?.message ||
                            fallbackErr?.message ||
                            'Failed to load refund requests',
                        fallbackErr?.response?.status ||
                            HttpStatus.BAD_GATEWAY,
                    );
                }
            }

            throw new HttpException(
                typeof upstream === 'string'
                    ? upstream
                    : Array.isArray(upstream)
                      ? upstream.join(', ')
                      : `Failed to load refund requests from vendor-service` +
                        (status ? ` (HTTP ${status})` : ' (no response / timeout)'),
                status || HttpStatus.BAD_GATEWAY,
            );
        }
    }

    // --- Customer / B2C proxies -------------------------------------------------
    async getCustomerDashboard(
        token: string,
        search?: string,
        page: number = 1,
        limit: number = 10,
        sortBy: string = 'customer_name',
        sortOrder: 'ASC' | 'DESC' = 'ASC',
        from_date?: string,
        to_date?: string,
        min_amount?: number,
        max_amount?: number,
    ) {
        if (!this.CUSTOMER_SERVICE_URL) {
            throw new HttpException('CUSTOMER_SERVICE_URL is not configured in admin-service', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        const headers = { Authorization: token };

        const params: Record<string, any> = { page, limit, sortBy, sortOrder };
        if (search?.trim()) params.search = search.trim();
        if (from_date) params.from_date = from_date;
        if (to_date) params.to_date = to_date;
        if (min_amount !== undefined) params.min_amount = min_amount;
        if (max_amount !== undefined) params.max_amount = max_amount;

        const summaryUrl = `${this.CUSTOMER_SERVICE_URL}/wallet/admin/summary`;
        const customersUrl = `${this.CUSTOMER_SERVICE_URL}/wallet/admin/customers`;

        console.log('Fetching customer dashboard data', { summaryUrl, customersUrl, params, authHeader: headers.Authorization });

        try {
            const authPresent = Boolean((headers as any).Authorization);
            console.debug('Proxying to customer-service', { summaryUrl, customersUrl, authPresent });

            const [summary, customers] = await Promise.all([
                axios.get(summaryUrl, { headers }),
                axios.get(customersUrl, { headers, params }),
            ]);

            return { ...summary.data, customers: customers.data };
        } catch (err: any) {
            console.error('customer-service proxy error', err?.response?.status, err?.response?.data?.message || err.message);
            if (err?.response) {
                const status = err.response.status || 502;
                const message = err.response.data?.message || `Upstream customer-service returned ${status}`;
                throw new HttpException(message, status);
            }
            throw new HttpException('Failed to contact customer-service', HttpStatus.BAD_GATEWAY);
        }
    }

    async downloadCustomerCsv(token: string, query: Record<string, any>): Promise<Buffer> {
        const headers = { Authorization: token };
        const response = await axios.get(
            `${this.CUSTOMER_SERVICE_URL}/wallet/admin/customers/download`,
            { headers, params: query, responseType: 'arraybuffer' },
        );
        return Buffer.from(response.data);
    }

    async getCustomerSummary(customerId: string, token: string) {
        const res = await axios.get(
            `${this.CUSTOMER_SERVICE_URL}/wallet/customers/${customerId}/summary`,
            { headers: { Authorization: token } },
        );
        return res.data;
    }

    async getCustomerTransactions(
        customerId: string,
        token: string,
        query: {
            type?: string;
            search?: string;
            payment_method?: string;
            from_date?: string;
            to_date?: string;
            page?: number;
            limit?: number;
        },
    ) {
        const res = await axios.get(
            `${this.CUSTOMER_SERVICE_URL}/wallet/customers/${customerId}/transactions`,
            { headers: { Authorization: token }, params: query },
        );
        return res.data;
    }

    async downloadCustomerTransactions(
        customerId: string,
        token: string,
        query: {
            type?: string;
            search?: string;
            payment_method?: string;
            from_date?: string;
            to_date?: string;
        },
    ): Promise<{ data: Buffer; contentType: string; filename: string }> {
        const res = await axios.get(
            `${this.CUSTOMER_SERVICE_URL}/wallet/customers/${customerId}/transactions/download`,
            {
                headers: { Authorization: token },
                params: query,
                responseType: 'arraybuffer',
            },
        );

        return {
            data: Buffer.from(res.data),
            // contentType: res.headers['content-type'] ?? 'text/csv',
            contentType: (res.headers['content-type'] as string) ?? 'text/csv',
            filename: `transactions-customer-${customerId}-${Date.now()}.csv`,
        };
    }

    async getAllCustomerRefundRequests(token: string, query: {
        search?: string;
        refund_type?: string;
        refund_status?: string;
        from_date?: string;
        to_date?: string;
        page?: number;
        limit?: number;
    }) {
        const res = await axios.get(
            `${this.CUSTOMER_SERVICE_URL}/wallet/admin/refund-requests`,
            {
                headers: { Authorization: token },
                params: query,
            },
        );
        return res.data;
    }

    async getCustomerRefundById(id: string, token: string) {
        const res = await axios.get(
            `${this.CUSTOMER_SERVICE_URL}/wallet/admin/refund-requests/${id}`,
            { headers: { Authorization: token } },
        );
        return res.data;
    }

    async confirmCustomerRefund(
        id: string,
        token: string,
        body: {
            status: string;
            refund_amount?: number;
            payment_transaction_id?: string;
            description?: string;
        },
    ) {
        const res = await axios.patch(
            `${this.CUSTOMER_SERVICE_URL}/wallet/admin/refund-requests/${id}`,
            body,
            { headers: { Authorization: token } },
        );
        return res.data;
    }

    async downloadCustomerRefundRequests(token: string, query: {
        search?: string;
        refund_type?: string;
        refund_status?: string;
        from_date?: string;
        to_date?: string;
    }) {
        const res = await axios.get(
            `${this.CUSTOMER_SERVICE_URL}/wallet/admin/refund-requests/download`,
            {
                headers: { Authorization: token },
                params: query,
                responseType: 'arraybuffer',
            },
        );
        return {
            data: Buffer.from(res.data),
            contentType: res.headers['content-type'] ?? 'text/csv',
            filename: `customer-refund-requests-${Date.now()}.csv`,
        };
    }

    async getRefundById(id: string, token: string) {
        const res = await axios.get(
            `${this.VENDOR_SERVICE_URL}/wallet/admin/refund-requests/${id}`,
            { headers: { Authorization: token } },
        );
        return res.data;
    }

    async confirmRefund(
        id: string,
        token: string,
        body: {
            status: string;
            refund_amount?: number;
            payment_transaction_id?: string;
            description?: string;
        },
    ) {
        const res = await axios.patch(
            `${this.VENDOR_SERVICE_URL}/wallet/admin/refund-requests/${id}`,
            body,
            { headers: { Authorization: token } },
        );
        return res.data;
    }

    async downloadRefundRequests(token: string, query: {
        search?: string;
        refund_type?: string;
        refund_status?: string;
        from_date?: string;
        to_date?: string;
    }) {
        const res = await axios.get(
            `${this.VENDOR_SERVICE_URL}/wallet/admin/refund-requests/download`,
            {
                headers: { Authorization: token },
                params: query,
                responseType: 'arraybuffer',
            },
        );
        return {
            data: Buffer.from(res.data),
            contentType: res.headers['content-type'] ?? 'text/csv',
            filename: `refund-requests-${Date.now()}.csv`,
        };
    }
}