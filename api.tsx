import axios from 'axios'

const base_url = "https://6071d90469c9.ngrok-free.app"


const api =  axios.create({
    baseURL:base_url
})

export default api