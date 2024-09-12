import axios from 'axios';
export const axiosClient = axios.create({
    baseURL: 'https://react-laravel.infinityfreeapp.com',
    withCredentials: true,
    withXSRFToken: true
});