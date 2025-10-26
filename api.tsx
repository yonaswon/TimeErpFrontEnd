import axios from 'axios'

const base_url = "https://5342c9150869.ngrok-free.app"


const api =  axios.create({
    baseURL:base_url
})

export default api