import { User } from '../models/user';
import { Room } from '../models/room';

export class RoomUtils {

    public static getAvailableSlotInRoom(room: Room): number {
        return room.users.findIndex((user: User) => user === undefined);
    }

    public static getUserSlotInRoom(room: Room, target: User): number {
        return room.users.findIndex((user: User) => user.uid === target.uid);
    }

    public static isEmptyRoom(room: Room): boolean {
        return room.users.findIndex((user: User) => user !== undefined) === -1;
    }

    public static areAllPlayersReadyInRoom(room: Room): boolean {
        return room.users.findIndex((user: User) => user && !user.isReady) === -1;
    }

    public static hasAtLeastTwoPlayers(room: Room): boolean {
        return room.users.filter((user: User) => user).length >= 1;
    }
}
