import {User} from "../user";
import {Room} from "../room";
import {Vector2} from "../vector2";

export class PunchResponse {
    public user: User;
    public room: Room;
    public direction: Vector2;

    constructor(user: User, room: Room, direction: Vector2) {
        this.user = user;
        this.room = room;
        this.direction = direction;
    }
}
