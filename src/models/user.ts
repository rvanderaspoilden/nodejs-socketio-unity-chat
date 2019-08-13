import {Vector3} from "./vector3";

export class User {
    public uid: string;
    public username: string;
    public champion: string;
    public position: Vector3;
    public isReady: boolean;
    public isInstantiated: boolean;
    public isDead: boolean;
    public life: string;
    public hitBy: string;
    public kills: string;
    public deads: string;

    constructor() {
    }

    public isAlive(): boolean {
        return Number(this.life) > 0;
    }
}
