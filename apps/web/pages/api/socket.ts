import type { NextApiRequest } from "next";
import type { NextApiResponseServerIO } from "@/types/next";
import { Server as IOServer } from "socket.io";
import { CommunicationHub } from "@/lib/communication/communication-hub";
import { setCommunicationHubInstance } from "@/lib/communication";

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, {
      path: "/api/socket_io",
      cors: {
        origin: process.env.NEXT_PUBLIC_WEB_BASE_URL ?? "*"
      }
    });

    res.socket.server.io = io;
    const hub = new CommunicationHub(io);
    setCommunicationHubInstance(hub);
  }

  res.end();
};

export const config = {
  api: {
    bodyParser: false
  }
};

export default ioHandler;
