import axios from "services/request";

export async function getLinkPreview(url: string): Promise<any> {
    const request = await axios.get(url);
    const {data, status} = request;
    if (data && status === 200) {
        return data;
    }
    return null;
}