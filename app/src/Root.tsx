"use strict";

import * as React from 'react';
import {History} from "history";
import  Redux, {Provider} from 'react-redux';

import Layout from "./pages/Layout";

interface IRootType {
    store: Redux.Store<any>;
    history: History;
}


export default function Root({ store }: IRootType) {
    return (
        <Provider store={store}>
            <Layout/>
        </Provider>
    );
}
