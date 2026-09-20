import express from "express"
import {router} from "./routes/auth.js"
import {createClient} from "redis"
const app = express();
app.use(express.json());

// add routes

app.get("/health", (req , res)=>{
	return res.json({"msg" : "healthy"});
})

app.use("/auth" , router);

const client = createClient({
  url: 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

// Connect and start server
const start = async () => {
  await client.connect();
  app.listen(3000, () => console.log('Server running on port 3000'));
};

start();

export { client };
