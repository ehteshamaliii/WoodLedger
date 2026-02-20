import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";


const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();



app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error("Error occurred handling request:", err);
            res.statusCode = 500;
            res.end("internal server error");
        }
    });

    const io = new Server(server, {
        path: "/api/socket/io",
        addTrailingSlash: false,
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        // Join room based on user role or ID (for targeted notifications)
        socket.on("join_room", (room) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room ${room}`);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

    // Make IO accessible globally (for API routes to emit events)
    // This is a simple way; in production you might use Redis adapter or a separate microservice
    // But for this monolithic next.js setup, we can attach it to the global object or use a singleton pattern.
    // However, API routes in Next.js run in a separate context (serverless functions potentially),
    // so they cannot directly access this `io` instance if deployed on Vercel/Serverless.
    // Since this is a custom server setup, we are likely running as a long-running Node process.
    // We can attach io to the global object for simplicity in this specific architecture.
    (global as any).io = io;

    server.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Socket.IO server running at http://${hostname}:${port}/api/socket/io`);
    });
});
