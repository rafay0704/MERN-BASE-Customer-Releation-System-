import axios from "axios";


const instance = axios.create({
    baseURL:import.meta.env.VITE_BACKEND_URL,
    headers:{
        'Content-Type':'application/json'

    } ,
    withCredentials:true,
})

export const get=(url,params) => instance.get(url,{params})
// export const post=(url,data) => instance.post(url,data)
export const post = (url, data, config = {}) => {
    return instance.post(url, data, {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json',
      },
    });
  };
  
export const put=(url,data) => instance.put(url,data)
export const delet=(url) => instance.delete(url)


// Add a request interceptor
instance.interceptors.request.use(function (config) {
    // Do something before request is sent
    return config;
  }, function (error) {
    // Do something with request error
    return Promise.reject(error);
  });

// Add a response interceptor
instance.interceptors.response.use(function (response) {
    
    return response;
  }, function (error) {
   
    return Promise.reject(error);
  });