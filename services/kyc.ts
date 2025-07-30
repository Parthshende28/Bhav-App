import API from '@/store/api';

export interface KYCData {
    fullName: string;
    panNumber: string;
    aadharNumber: string;
    gstNumber?: string;
    address: string;
    panImage?: string;
    aadharImage?: string;
    selfieImage?: string;
}

export interface KYCResponse {
    success: boolean;
    message?: string;
    kyc?: any;
    kycApplications?: any[];
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
    };
}

class KYCService {
    // Submit KYC application
    async submitKYC(formData: FormData): Promise<KYCResponse> {
        try {
            const response = await API.post('/kyc/submit', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to submit KYC');
        }
    }

    // Get KYC status for current user
    async getKYCStatus(): Promise<KYCResponse> {
        try {
            const response = await API.get('/kyc/status');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get KYC status');
        }
    }

    // Update KYC application
    async updateKYC(formData: FormData): Promise<KYCResponse> {
        try {
            const response = await API.put('/kyc/update', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update KYC');
        }
    }

    // Admin: Get all KYC applications
    async getAllKYCApplications(status?: string, page: number = 1, limit: number = 10): Promise<KYCResponse> {
        try {
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            params.append('page', page.toString());
            params.append('limit', limit.toString());

            const response = await API.get(`/kyc/admin/applications?${params}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get KYC applications');
        }
    }

    // Admin: Get KYC by ID
    async getKYCById(kycId: string): Promise<KYCResponse> {
        try {
            const response = await API.get(`/kyc/admin/${kycId}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get KYC details');
        }
    }

    // Admin: Approve KYC
    async approveKYC(kycId: string): Promise<KYCResponse> {
        try {
            const response = await API.patch(`/kyc/admin/${kycId}/approve`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to approve KYC');
        }
    }

    // Admin: Reject KYC
    async rejectKYC(kycId: string, rejectionReason: string): Promise<KYCResponse> {
        try {
            const response = await API.patch(`/kyc/admin/${kycId}/reject`, {
                rejectionReason
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to reject KYC');
        }
    }
}

export const kycAPI = new KYCService(); 