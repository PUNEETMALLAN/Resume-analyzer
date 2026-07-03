import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Resume APIs
export const analyzeResume = (formData) =>
    API.post("/analyze", formData);

export const buildResume = (analysisId) =>
    API.post("/build", { analysisId });

export const getHistory = () =>
    API.get("/history");

export const deleteAnalysis = (id) =>
    API.delete(`/history/${id}`);

// Auth APIs
export const registerUser = (data) =>
    API.post("/auth/register", data);

export const verifyOTP = (data) =>
    API.post("/auth/verify-otp", data);

export const loginUser = (data) =>
    API.post("/auth/login", data);