import { ConnectionRequest } from '../models/requests/connection-request';
import { User } from '../models/user';

export class CommonUtils {
    public static getRandomInt(max): number {
        return Math.floor(Math.random() * Math.floor(max));
    }

    public static createUser(socketId: string, info: ConnectionRequest): User {
        const user = new User();
        user.uid = socketId;
        user.username = info.username;
        user.champion = info.champion;
        user.isReady = false;

        return user;
    }

    public static createUUID(): string {
        let dt = new Date().getTime();
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }
}
