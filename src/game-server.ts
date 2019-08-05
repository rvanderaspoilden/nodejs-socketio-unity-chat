import {createServer, Server} from 'http';
import * as express from 'express';
import * as socketIO from 'socket.io';
import {User} from "./models/user";
import {Vector3} from "./models/vector3";
import {Utils} from "./utils";
import {InitGameResponse} from "./models/init-game-response";
import * as _ from 'lodash';
import {UpdatePositionResponse} from "./models/update-position-response";
import {UpdateRotationResponse} from "./models/update-rotation-response";
import {ConnectionRequest} from "./models/connection-request";
import {AnimationParameterResponse} from "./models/animation-parameter-response";
import { CommonUtils } from './utils/common.utils';

export class GameServer {
    public static readonly PORT: number = 8080;
    private app: express.Application;
    private server: Server;
    private io: socketIO.Server;
    private port: string | number;
    private users: User[];
    private spawns: Vector3[];

    constructor() {
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
    }

    private createApp(): void {
        this.app = express();
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private config(): void {
        this.port = process.env.PORT || GameServer.PORT;
    }

    private sockets(): void {
        this.io = socketIO(this.server);
    }

    private listen(): void {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });

        this.io.on('connect', (socket: any) => {
            const currentUser: User = new User('undefined', "undefined", "undefined", new Vector3('0', '0', '0'), new Vector3('0', '0', '0'));

            this.spawns = [
                new Vector3('-7.1', '1.7', '0'),
                new Vector3('-1.28', '1.7', '0'),
                new Vector3('4.30', '1.7', '0'),
                new Vector3('7.70', '1.7', '0')];

            console.log('Connected client on port %s.', this.port);

            socket.on('Packet::JoinGame', (data: ConnectionRequest) => {
                console.log(data.username + " joined the game");
                currentUser.uid = socket.id;
                currentUser.username = data.username;
                currentUser.champion = data.champion;
                currentUser.position = this.spawns[CommonUtils.getRandomInt(this.spawns.length)];

                if (this.users) {
                    this.users.push(currentUser);
                } else {
                    this.users = [currentUser];
                }

                const gameData = new InitGameResponse();
                gameData.localUser = currentUser;
                gameData.users = {list: this.users};

                console.log("Users number : " + this.users.length);

                socket.emit("Packet::InitGame", gameData);
                socket.broadcast.emit("Packet::OtherPlayerJoined", gameData.localUser);
            });

            socket.on('Packet::SetAnimationParameterRequest', (data: AnimationParameterResponse) => {
                data.uid = currentUser.uid;
                socket.broadcast.emit("Packet::OtherPlayerDoAnimation", data);
            });

            socket.on('Packet::UpdatePosition', (data: UpdatePositionResponse) => {
                let user = this.users.find(user => user.uid === currentUser.uid);
                user.position.x = data.x.toString();
                user.position.y = data.y.toString();
                user.position.z = data.z.toString();

                data.uid = currentUser.uid;

                socket.broadcast.emit("Packet::OtherPlayerMove", data);
            });

            socket.on('disconnect', () => {
                console.log(currentUser.username + ' disconnected');

                this.users = _.reject(this.users, (user: User) => user.uid === currentUser.uid);
                socket.broadcast.emit("Packet::OtherPlayerDisconnected", currentUser);

                console.log("Users number : " + this.users.length);
            });
        });
    }

    public getApp(): express.Application {
        return this.app;
    }
}
