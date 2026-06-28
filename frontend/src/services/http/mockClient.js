import axios from 'axios';

const mockClient = axios.create({
    baseURL: '',
    headers: { 'Content-Type': 'application/json' },
});

export default mockClient;