"use strict";

import conf from "configs/configurations";

let connection: any;

function createConnection(): any {
    return new (Strophe.Connection as any)(conf.socket, {
        mechanisms: [Strophe.SASLPlain]
    });
}

export default (() => {
    return {
        getConnection: () => {
            if (!connection) {
                connection = createConnection();
            }
            // connection.disconnect()
            return connection;
        },
        reconnect: () => {

            if (connection.connected) {
                connection.disconnect()
            }

            connection = createConnection();

            return connection;
        }
    };
})();
