import { User } from './user';
import { RoomStatus } from './room-status';
import { CommonUtils } from '../utils/common.utils';

export class Room {
    public id: string;
    public users: User[];
    public status: RoomStatus;

    constructor() {
        this.id = CommonUtils.createUUID();
        this.users = new Array<User>(4);
        this.status = RoomStatus.OPEN;
    }
}