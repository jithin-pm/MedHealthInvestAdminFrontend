export const getErrorMessage = (error) => {
    // Network or CORS errors where no response is received
    if (!error.response && error.request) {
        return "A network error occurred. Please check your connection and try again.";
    }
    
    // API-specific error messages
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.response?.data?.error) {
        return error.response.data.error;
    }
    if (typeof error.response?.data === 'string') {
        return error.response.data;
    }
    
    // Fallback to the generic error message
    return error.message || "An unexpected error occurred.";
};

export const getErrorTitle = (error) => {
    if (!error.response && error.request) {
        return "Network Error";
    }
    if (error.response?.status >= 500) {
        return "Server Error";
    }
    if (error.response?.status === 403 || error.response?.status === 401) {
        return "Authentication Error";
    }
    if (error.response?.status === 404) {
        return "Not Found";
    }
    return "Error";
};
