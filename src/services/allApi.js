import { commonApi } from "./CommonApi";
import { BASE_URL } from "./baseUrl";

// Admin Login
export const adminLoginApi = async (data) => {
    return await commonApi("POST", "/api/auth/admin-login", data, "");
};

// If there are other admin specific APIs, they can be added here
// For example:
export const getAllUsersApi = async () => {
    return await commonApi("GET", "/api/auth/all-users", "", "");
};

// Category APIs
export const addCategoryApi = async (data) => {
    return await commonApi("POST", "/api/category/add", data, "");
};

export const getAllCategoriesApi = async () => {
    return await commonApi("GET", "/api/category/all", "", "");
};

// Project APIs
export const addProjectApi = async (data) => {
    return await commonApi("PATCH", "/api/project/add", data, {
        "Content-Type": "multipart/form-data"
    });
};

export const editProjectApi = async (id, data) => {
    return await commonApi("PATCH", `/api/project/edit/${id}`, data, {
        "Content-Type": "multipart/form-data"
    });
};

export const getAllProjectsApi = async () => {
    return await commonApi("GET", "/api/project/all?isAdmin=true", "", "");
};

export const getProjectByIdApi = async (id) => {
    return await commonApi("GET", `/api/project/get/${id}`, "", "");
};

export const deleteProjectApi = async (id) => {
    return await commonApi("DELETE", `/api/project/delete/${id}`, {}, "");
};

// Enquiry APIs
export const getAllEnquiriesApi = async () => {
    return await commonApi("GET", "/api/enquiry", "", "");
};

export const getEnquiriesByTypeApi = async (type) => {
    return await commonApi("GET", `/api/enquiry/type/${type}`, "", "");
};

// Chat APIs
export const getActiveChatsApi = async () => {
    return await commonApi("GET", "/api/chat/active-chats", "", "");
};

export const getChatMessagesApi = async (userId) => {
    return await commonApi("GET", `/api/chat/messages/${userId}`, "", "");
};

export const uploadChatFileApi = async (reqBody, reqHeader) => {
    return await commonApi("POST", "/api/chat/upload", reqBody, reqHeader);
};

export const deleteChatMessageApi = async (messageId) => {
    return await commonApi("DELETE", `/api/chat/messages/${messageId}`, "", "");
};

// Payment/Investment APIs
export const getProjectInvestorsApi = async (projectId) => {
    return await commonApi("GET", `/api/payment/investors/${projectId}`, "", "");
};

export const getUserFinancialDetailsApi = async (userId) => {
    return await commonApi("GET", `/api/payment/user-details/${userId}`, "", "");
};

export const recordPaybackApi = async (investmentId, data) => {
    return await commonApi("POST", `/api/payment/record-payback/${investmentId}`, data, {
        "Content-Type": "multipart/form-data"
    });
};

export const adminRecordInvestmentApi = async (data) => {
    return await commonApi("POST", "/api/payment/admin-record-investment", data, "");
};

export const getAllTransactionsApi = async () => {
    return await commonApi("GET", "/api/payment/all", "", "");
};

// Dashboard APIs
export const getDashboardStatsApi = async () => {
    return await commonApi("GET", "/api/dashboard/stats", "", "");
};

// User Verification details API
export const getUserVerificationStatusApi = async (userId) => {
    return await commonApi("GET", `/api/auth/verification-status/${userId}`, "", "");
};
