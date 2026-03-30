import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

function createClientPromise(): Promise<MongoClient> {
  if (!uri) {
    return Promise.reject(
      new Error("MONGODB_URI no está definida. Creá .env.local con la cadena de conexión (ver .env.example)."),
    );
  }
  const client = new MongoClient(uri);
  return client.connect();
}

function getClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    if (!globalForMongo._mongoClientPromise) {
      globalForMongo._mongoClientPromise = createClientPromise();
    }
    return globalForMongo._mongoClientPromise;
  }
  return createClientPromise();
}

export async function getDb() {
  const client = await getClientPromise();
  const name = process.env.MONGODB_DB ?? "lindissima";
  return client.db(name);
}
