import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: '/api',
    withCredentials: true
});

// Returns the logged-in user ({ id, email, role }) or null if there is no valid session
export const authCheckOnMount = async () => {
    try {
        const response = await axiosInstance.get('/auth/me');
        return response.data.user;
    } catch {
        return null;
    }
};

export const login = async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
};

export const signup = async (credentials) => {
    const response = await axiosInstance.post('/auth/signup', credentials);
    return response.data;
};

export const logout = async () => {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
};

export const saveDraft = async (blogData) => {
    const payload = { ...blogData };
    if (payload.id) {
        payload._id = payload.id;
        delete payload.id;
    }
    const response = await axiosInstance.post('/blogs/save-draft', payload);
    return response.data;
};

export const publishBlog = async (blogData) => {
    const payload = { ...blogData };
    if (payload.id) {
        payload._id = payload.id;
        delete payload.id;
    }
    const response = await axiosInstance.post('/blogs/publish', payload);
    return response.data;
};

export const getBlogs = async () => {
    const response = await axiosInstance.get('/blogs');
    return response.data;
};

export const getBlog = async (id) => {
    const response = await axiosInstance.get(`/blogs/${id}`);
    return response.data;
};

export const deleteBlog = async (id) => {
    const response = await axiosInstance.delete(`/blogs/${id}`);
    return response.data;
};

// Admin only: the server answers 403 for any other role
export const getAllBlogsAdmin = async () => {
    const response = await axiosInstance.get('/blogs/admin/all');
    return response.data;
};

export const adminDeleteBlog = async (id) => {
    const response = await axiosInstance.delete(`/blogs/admin/${id}`);
    return response.data;
};
