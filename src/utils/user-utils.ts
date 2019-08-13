import { User } from '../models/user';
import {ConnectionRequest} from "../models/requests/connection-request";
import { Room } from '../models/room';

export class UserUtils {
    public static kill(target: User, killer: User): void {
        target.isDead = true;
        target.deads = target.deads + 1;
        killer.kills = killer.kills + 1;
    }

    public static createUser(socketId: string, info: ConnectionRequest): User {
        const user = new User();
        user.uid = socketId;
        user.username = info.username;
        user.champion = info.champion;
        user.isReady = false;
        user.kills = "0";
        user.deads = "0";
        user.hitBy = "";
        user.life = "100";

        return user;
    }

    public static areAllUsersInstantiated(users: User[]): boolean {
        return users.every((user: User) => user.isInstantiated);
    }
}
