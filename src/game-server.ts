import {createServer, Server} from 'http';
import * as express from 'express';
import * as socketIO from 'socket.io';
import {User} from './models/user';
import {Vector3} from './models/vector3';
import {UpdatePositionResponse} from './models/update-position-response';
import {ConnectionRequest} from './models/requests/connection-request';
import {AnimationParameterResponse} from './models/animation-parameter-response';
import {CommonUtils} from './utils/common.utils';
import {Room} from './models/room';
import {RoomStatus} from './models/room-status';
import {RoomResponse} from './models/responses/room-response';
import * as _ from 'lodash';
import {RoomUtils} from './utils/room.utils';

export class GameServer {
    public static readonly PORT: number = 8080;
    private app: express.Application;
    private server: Server;
    private io: socketIO.Server;
    private port: string | number;
    private rooms: Room[];
    private spawns: Vector3[];

    constructor() {
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
    }

    private createApp(): void {
        this.app = express();
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private config(): void {
        this.port = process.env.PORT || GameServer.PORT;
    }

    private sockets(): void {
        this.io = socketIO(this.server);
    }

    private listen(): void {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });

        this.io.on('connect', (socket: any) => {
            let currentUser: User = new User();
            let currentRoom: Room;
            let currentSlotInRoom: number;

            this.spawns = [
                new Vector3('-6.43844', '3.495037', '0'),
                new Vector3('-2.26844', '3.495037', '0'),
                new Vector3('1.94156', '3.495037', '0'),
                new Vector3('5.34156', '3.495037', '0')
            ];

            socket.on('Packet::JoinRoomRequest', (data: ConnectionRequest) => {
                // Create user
                currentUser = CommonUtils.createUser(socket.id, data);

                // Retrieve a room
                currentRoom = this.findOrCreateRoom();

                // Find available slot in room and add current user
                currentSlotInRoom = RoomUtils.getAvailableSlotInRoom(currentRoom);
                currentRoom.users[currentSlotInRoom] = currentUser;

                currentUser.position = this.spawns[currentSlotInRoom];

                // Check if room is full
                if (RoomUtils.getAvailableSlotInRoom(currentRoom) === -1) {
                    currentRoom.status = RoomStatus.FULL;
                }

                // Join socket of current room to only communicate with room players and no one else
                socket.join(currentRoom.id);

                console.log(this.rooms);

                // Send response packets
                socket.emit('Packet::InitRoom', new RoomResponse(currentUser, currentRoom));
                socket.to(currentRoom.id).broadcast.emit('Packet::OtherPlayerJoinedRoom', new RoomResponse(currentUser, currentRoom));
            });

            socket.on('Packet::UpdatePlayerStatusInRoomRequest', () => {
                // Change user ready status
                currentUser.isReady = !currentUser.isReady;

                // Notify all
                socket.emit('Packet::UpdatePlayerStatusInRoomResponse', new RoomResponse(currentUser, currentRoom));
                socket.to(currentRoom.id).broadcast.emit('Packet::UpdateOtherPlayerStatusInRoomResponse', new RoomResponse(currentUser, currentRoom));

                // Check if all players are ready to start the game
                if (RoomUtils.hasAtLeastTwoPlayers(currentRoom) && RoomUtils.areAllPlayersReadyInRoom(currentRoom) && currentRoom.status !== RoomStatus.STARTING) {
                    console.log("Starting...");
                    this.startGame(currentRoom);
                }
            });

            socket.on('Packet::LeaveRoomRequest', () => {
                // Clean user slot
                currentRoom.users[currentSlotInRoom] = undefined;

                // Change room status
                currentRoom.status = RoomStatus.OPEN;

                // Notify other players in room
                socket.to(currentRoom.id).broadcast.emit('Packet::OtherPlayerLeftRoom', new RoomResponse(currentUser, currentRoom));

                socket.leave(currentRoom.id);

                // Check if there is some one else or delete room
                if (RoomUtils.isEmptyRoom(currentRoom)) {
                    this.rooms = _.reject(this.rooms, (room: Room) => room.id === currentRoom.id);
                    console.log('Room deleted');
                }

                // Reset current room variable
                currentRoom = undefined;
                currentSlotInRoom = undefined;
            });

            socket.on('Packet::SetAnimationParameterRequest', (data: AnimationParameterResponse) => {
                data.uid = currentUser.uid;
                socket.broadcast.emit('Packet::OtherPlayerDoAnimation', data);
            });

            socket.on('Packet::UpdatePositionRequest', (data: UpdatePositionResponse) => {
                currentUser.position.x = data.x.toString();
                currentUser.position.y = data.y.toString();
                currentUser.position.z = data.z.toString();

                data.uid = currentUser.uid;

                socket.broadcast.emit('Packet::OtherPlayerMove', data);
            });

            socket.on('disconnect', () => {
                console.log(currentUser.username + ' disconnected');

                if (currentRoom) {
                    // Clean user slot
                    currentRoom.users[currentSlotInRoom] = undefined;

                    // Send informations to all other players of the room
                    if (currentRoom.status === RoomStatus.INGAME) {
                        console.log(currentUser.username + ' remove from game');
                        socket.broadcast.to(currentRoom.id).broadcast.emit('Packet::OtherPlayerLeftGame', currentUser);
                    } else {
                        currentRoom.status = RoomStatus.OPEN;
                        socket.broadcast.to(currentRoom.id).broadcast.emit('Packet::OtherPlayerLeftRoom', new RoomResponse(currentUser, currentRoom));
                    }

                    // Leave socket room
                    socket.leave(currentRoom.id);

                    // Check if there is some one else or delete room
                    if (RoomUtils.isEmptyRoom(currentRoom)) {
                        this.rooms = _.reject(this.rooms, (room: Room) => room.id === currentRoom.id);
                        console.log('Room deleted');
                    }
                }

                console.log(this.rooms);
            });
        });
    }

    public startGame(room: Room): void {
        room.status = RoomStatus.STARTING;

        // Init starting counter
        room.secondRemainingBeforeStart = 3;

        // Notify all players of starting counter
        this.io.sockets.to(room.id).emit('Packet::GameStartingResponse', new RoomResponse(null, room));

        console.log(room.secondRemainingBeforeStart);

        // Check each seconds if all players are still ready to continue else stop and re-open room
        let counterInterval = setInterval(() => {
            if (RoomUtils.areAllPlayersReadyInRoom(room)) {
                room.status = RoomStatus.STARTING;
                room.secondRemainingBeforeStart = room.secondRemainingBeforeStart - 1;
                console.log(room);
                console.log(room.secondRemainingBeforeStart);
            } else {
                room.status = RoomStatus.OPEN;
                console.log("All players are not ready");
                clearInterval(counterInterval);
            }

            this.io.sockets.to(room.id).emit('Packet::GameStartingResponse', new RoomResponse(null, room));

            // Start game if counter reached 0s
            if (room.secondRemainingBeforeStart === 0) {
                console.log("GOOOOOOOOO");
                room.status = RoomStatus.INGAME;
                this.io.sockets.to(room.id).emit('Packet::StartGameResponse', new RoomResponse(null, room));
                console.log(room);
                clearInterval(counterInterval);
            }
        }, 1000);
    }

    public getApp(): express.Application {
        return this.app;
    }

    private findOrCreateRoom(): Room {
        if (!this.rooms) {
            this.rooms = [];
        }

        const matchedRoom: Room = this.rooms.find((room: Room) => room.status === RoomStatus.OPEN);

        if (matchedRoom) {
            return matchedRoom;
        }

        const newRoom: Room = new Room();
        this.rooms.push(newRoom);

        return newRoom;
    }
}
