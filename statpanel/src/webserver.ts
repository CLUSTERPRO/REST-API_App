import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Server as HTTPSServer } from 'https';
import { Client, type ClientOptions, type ExecuteOperationParams } from './clusterapi.js';

export type { ClientOptions };

/** Sample GUI server class */
export class WebServer {
    // Socket.io server
    io: Server;
    // Client objects to access CLUSTERPRO/EXRESSCLUSTER RESTful API
    clients: Record<string, Client> = {};

    constructor(server: HTTPServer | HTTPSServer) {
        const io = new Server(server);
        this.io = io;
        // io.of('/ws').on('connection', this.handlerOnConnection());
        io.on('connection', this.handlerOnConnection());
    }

    addClusterServer(opts: ClientOptions | ClientOptions[]) {
        if (Array.isArray(opts)) {
            for (const opt of opts) {
                this.clients[opt.clpserver] = new Client(opt);
            }
        } else {
            this.clients[opts.clpserver] = new Client(opts);
        }
    }

    async checkClusterStatus() {
        if (this.clients) {
            try {
                // 定期的にClusterStatusを取得する
                const jobs = Object.values(this.clients).map(async (client) => {
                    const status = await client.getClusterStatus();
                    // 各ブラウザにClusterStatusをpushする
                    this.io.emit('status', status);
                });
                await Promise.all(jobs);
            } catch (err) {
                console.error(err);
            }
        } else {
            console.log('Empty cluster servers setting');
        }

        // set the next schedule
        setTimeout(() => {
            this.checkClusterStatus();
        }, 5000);
    }

    start() {
        this.checkClusterStatus();
    }

    handlerOnConnection() {
        return (socket: Socket) => {
            console.log(`connect: ${socket.id}`);
            socket.on('disconnect', this.handlerOnDisconnect(socket));
            socket.on('execute', this.handlerOnExecute(socket));
        };
    }

    handlerOnDisconnect(socket: Socket) {
        return () => {
            console.log(`disconnect: ${socket.id}`);
        };
    }

    handlerOnExecute(socket: Socket) {
        return async (id: string, params: ExecuteOperationParams) => {
            const client = this.clients[id];
            try {
                await client.execOperation(params);
                socket.emit('message', 'Operation succeeded');
            } catch (err) {
                let message;
                if (err instanceof Error) message = err.message;
                else message = String(err);
                socket.emit('error', message);
            }
        };
    }
}
