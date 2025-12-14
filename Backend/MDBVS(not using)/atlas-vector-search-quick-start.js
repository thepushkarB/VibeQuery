import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();
// import openai from "openai";
import getEmbedding from "../getEmbedding.js";

//? connect to your Atlas cluster
//? `monogodb`(native driver) used coz its req for features like `$vectorSearch` aggregation since `mongoose` package(ODM) doest not support vector search aggregation 
const uri = process.env.CONNECTION_STR_VECTOR;
const client = new MongoClient(uri);

// const apiKey = process.env.OPENAI_APIKEY;

const queryEmbedding = await getEmbedding("thriller movies");

async function run() {
    try {
        //? establish connection
        await client.connect();

        //? grab DB & collection
        const database = client.db("sample_mflix");
        const coll = database.collection("embedded_movies");

        // define aggregation pipeline
        const agg = [
            {
                //? perform ANN on vector index(ANN by default for MongoDB)
              '$vectorSearch': {
                'index': 'vector_index_1024',
                'path': 'plot_embedding_voyage_3_large',
                //? user query -> embeddings
                //? `queryVector` array must be in the same vector space and dimension as your stored embeddings
                // 'queryVector': queryEmbedding,
                'queryVector': queryEmbedding,
                //? parameter controlling how many candidate vectors are considered in an Approximate Nearest Neighbor (ANN) search.
                'numCandidates': 150,
                //? how many top results are returned
                'limit': 10
              }
            }, {
                //? filter fields to return
              '$project': {
                '_id': 0,
                'plot': 1,
                'title': 1,
                //? to show the relevance of each result to the search term
                'score': {
                  '$meta': 'vectorSearchScore'
                }
              }
            }
          ];

        //? run aggrefation pipeline
        const result = coll.aggregate(agg);

        //? print results in JSON format
        await result.forEach((doc) => console.dir(JSON.stringify(doc)));
    } finally {
        //? close DB connection 
        await client.close();
    }
}
run().catch(console.dir);
