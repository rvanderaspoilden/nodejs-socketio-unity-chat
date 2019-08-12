import { User } from './user';

export class KillResponse {
    public target: User;
    public killer: User;

    constructor(target: User, killer: User) {
        this.target = target;
        this.killer = killer;
    }
}