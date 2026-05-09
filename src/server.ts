import Fastify from "fastify";
import { fileRoutes } from "./routes/file-routes.js";

const fastify = Fastify({
  logger: true,
});

fastify.get("/", function (request, reply) {
  reply.send({ status: "O servidor esta funcionando" });
});

await fastify.register(fileRoutes);
await fastify.listen({ port: 3333 });
