import {Vector3} from "./vector3";

export class User {
    constructor(public uid: string,
                public username: string,
                public champion: string,
                public position: Vector3,
                public rotation: Vector3) {
        
    }
}
