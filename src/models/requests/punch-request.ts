import {Vector2} from "../vector2";

export class PunchRequest {
    public targetUserId: string;
    public damageAmount: string;
    public direction: Vector2;
}
