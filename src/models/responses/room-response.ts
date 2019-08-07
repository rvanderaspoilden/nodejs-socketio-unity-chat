import { Room } from '../room';
import { User } from '../user';

export class RoomResponse {
    public user: User;
    public room: Room;

    constructor(user: User, room: Room) {
        this.user = user;
        this.room = room;
    }
}
