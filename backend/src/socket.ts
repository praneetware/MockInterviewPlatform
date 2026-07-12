import { Server } from "socket.io";

import {
 registerInterviewSocket
}
from "./socket/interviewSocket";

let io: Server;

export const initSocket = (server: any) => {

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  registerInterviewSocket(io);
  return io;
};

export const getIO = () => io;



