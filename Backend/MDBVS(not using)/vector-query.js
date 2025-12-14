// * Create embeddings for vector search queries and run a query

import { MongoClient, ObjectId } from 'mongodb';
import getEmbedding from '../getEmbedding.js';
import dotenv from "dotenv";
dotenv.config();

// MongoDB connection URI and options
const client = new MongoClient(process.env.CONNECTION_STR_VECTOR);


async function run() {
    try {
        // Connect to the MongoDB client
        await client.connect();
        console.log(`✅ DB connection successful`);

        // Specify the database and collection
        const database = client.db("sample_mflix"); 
        console.log(`db: ${database}`);
        // console.log(JSON.stringify(database));
        const collection = database.collection("embedded_movies"); 
        console.log(`collection: ${collection}`);
        // console.log(JSON.stringify(collection));

        // Generate embedding for the search query
        const queryEmbedding = await getEmbedding("romcom movies");
        //todo: ✅ embddings-OK, dimensions:1024
        // console.log(`queryEmbedding: ${queryEmbedding} \n queryEmbedding dimension: ${queryEmbedding.length}`);

        //? DB calls
        // const movie = await collection.findOne({ _id: new ObjectId('573a1392f29313caabcd9ca6') });
        // console.log(`✅ Successful DB , movie: ${movie.title}`);

        // Define the sample vector search pipeline
        const pipeline = [
            {
                //? performs ANN/ENN
                $vectorSearch: {
                    index: "vector_index_1024",
                    queryVector: queryEmbedding,
                    path: "plot_embedding_voyage_3_large",
                    //* you can use either ANN or ENN
                    //? parameter controlling how many candidate vectors are considered in an Approximate Nearest Neighbor(ANN) search
                    numCandidates: 150,
                    //? configures search for Exact Nearest Neighbor(ENN)
                    // exact: true,
                    limit: 5,
                }
            },
            {
                $project: {
                    '_id': 0,
                    'plot': 1, 
                    'title': 1,
                    'score': {
                        '$meta': "vectorSearchScore"
                    }
                }
            }
        ];

        // run pipeline
        // const result = collection.aggregate(pipeline);
        //  console.log(`result: ${ result}`);
        // console.log(await collection.findOne({ _id: new ObjectId('573a1392f29313caabcd9ca6') }));
        // result.map((a)=>{
        //     console.log(a,"222");
        // })
        const result = await collection.aggregate(pipeline).toArray()
        console.log(`result.toArray(): ${result}`)
        // .then((items) => {
        //     console.log(`Items: ${JSON.stringify(items)} bakbakabkaba`);
        //     console.log();
        // })
        // .catch((error) => {
        //     console.error("❌ Error: ", error);
        // })
        //? print results
        for await (const doc of result) {
            console.log(doc)
            // console.log(JSON.stringify(doc));
        }

    } 
    finally {
        await client.close();
    }
}
run().catch(console.dir);




//* Mouhith code:
// import { MongoClient } from 'mongodb';
// import getEmbedding from './getEmbedding.js'; // Uses voyage-3-large
// import dotenv from "dotenv";
// dotenv.config();

// const client = new MongoClient(process.env.CONNECTION_STR_VECTOR);

// async function generateEmbeddings() {
//   console.log("Connecting to database...");
//   await client.connect();
//   const database = client.db("sample_mflix");
//   const collection = database.collection("embedded_movies");
//   console.log("✅ Database connected.");

 
//   const cursor = collection.find({ 
//     plot: { $exists: true }, 
//     plot_embedding_voyage_3_large: { $exists: false } 
//   });

//   let count = 0;
//   for await (const doc of cursor) {
//     try {
      
//       const embedding = await getEmbedding(doc.plot);
      
     
//       await collection.updateOne(
//         { _id: doc._id },
//         { $set: { plot_embedding_voyage_3_large: embedding } }
//       );
      
//       count++;
//       console.log(`(${count}) Embedded and updated: ${doc.title}`);
    
//     } catch (err) {
//       console.error(`Error processing document ${doc._id} (${doc.title}): ${err.message}`);
//     }
//   }

//   console.log(`Embedding generation complete. ${count} documents updated.`);
//   await client.close();
// }

// generateEmbeddings().catch(console.dir);
