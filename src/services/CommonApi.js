import instance from "./instance";

export const commonApi = async (method, url, data, header) => {
    let config = {
        method,
        url,
        headers: header ? header : (data instanceof FormData ? {} : { "Content-Type": "application/json" })
    }
    if (data) config.data = data;

    return await instance(config).then((res) => {
        return res
    });
}
