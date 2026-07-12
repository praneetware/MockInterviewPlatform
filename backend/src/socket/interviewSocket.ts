import { Server } from "socket.io";

export const registerInterviewSocket =
(io: Server) => {

  io.on(
    "connection",
    (socket) => {

      console.log(
        "User connected:",
        socket.id
      );

      socket.on(
        "disconnect",
        () => {

          console.log(
            "Disconnected:",
            socket.id
          );

        }
      );

    }
  );

};