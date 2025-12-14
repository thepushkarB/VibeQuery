import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

//* connect to your Atlas deployment
const uri =  process.env.CONNECTION_STR_VECTOR;

const client = new MongoClient(uri);

async function run() {
   try {
     const database = client.db("sample_mflix");
     const collection = database.collection("embedded_movies");
    
     //* define MongoDB Vector Search index object
     const index = {
         name: "vector_index_1024",
         //? performs by default ANN
         type: "vectorSearch",
         definition: {
           "fields": [
             {
               "type": "vector",
               //? embedding dimensions
               "numDimensions": 1024,
               //? field to search
               "path": "plot_embedding_voyage_3_large",
               //? similarity function
               "similarity": "dotProduct",
               //? each vector dimension is approximated using scalar quantization techniques, increasing query speed
               "quantization": "scalar"
             }
           ]
         }
     }

     //* run the helper method
     const result = await collection.createSearchIndex(index);
     console.log(`New search index named ${result} is building.`);

     //* wait for the index to be ready to query
     console.log("Polling to check if the index is ready. This may take up to a minute.")
     let isQueryable = false;
     while (!isQueryable) {
       const cursor = collection.listSearchIndexes();
       for await (const index of cursor) {
         if (index.name === result) {
           if (index.queryable) {
             console.log(`${result} is ready for querying.`);
             isQueryable = true;
           } else {
             await new Promise(resolve => setTimeout(resolve, 5000));
           }
         }
       }
     }
   } finally {
     await client.close();
   }
}
run().catch(console.dir);
