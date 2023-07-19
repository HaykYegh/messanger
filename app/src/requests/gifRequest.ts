"use strict";

import {GIF_SEARCH_LIMIT, GIPHY_API_KEY} from "configs/constants";
import axios from "services/request";

export const searchGifsRequest = (query, offset) => {

    const gifBaseUrl: string = "http://api.giphy.com/v1/gifs/";
    let url = `trending?api_key=${GIPHY_API_KEY}&limit=${GIF_SEARCH_LIMIT}&offset=${offset}`;

    if (query && query !== "") {
        url = `search?q=${query}&api_key=${GIPHY_API_KEY}&limit=${GIF_SEARCH_LIMIT}&offset=${offset}`;
    }

    return axios.get(`${gifBaseUrl}${url}`);

};

export const getGif = id => {

    const gifBaseUrl: string = "http://api.giphy.com/v1/gifs/";
    let url = `${id}?api_key=${GIPHY_API_KEY}`;

    return axios.get(`${gifBaseUrl}${url}`);
};
