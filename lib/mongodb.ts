import { MongoClient, Db } from 'mongodb';

const uri: string = process.env.MONGODB_URI || '';

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

// Only initialize MongoDB connection if URI is provided
// Skip initialization during build time to avoid errors
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

if (uri && !isBuildTime) {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

export async function getDatabase(): Promise<Db> {
  if (!uri) {
    throw new Error('MongoDB URI is not configured. Please add MONGODB_URI to your environment variables.');
  }
  if (!clientPromise) {
    throw new Error('MongoDB connection not initialized. Please check your environment variables.');
  }
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || 'evi-check');
}

