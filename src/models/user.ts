import {Vector3} from "./vector3";

export class User {
    public uid: string;
    public username: string;
    public champion: string;
    public position: Vector3;
    public isReady: boolean;

    constructor() {
    }
}
