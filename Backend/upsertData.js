//* Upsert Data into Pinecone
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();
import getDocs from "./getDocs.js";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY});

// const namespace = pc.index(process.env.INDEX_NAME, process.env.INDEX_HOST).namespace("__default__");
const namespace = pc.index(process.env.CUSTOMERS_INDEX_NAME, process.env.CUSTOMERS_INDEX_HOST).namespace("__default__");


//! When upserting records with text, a batch can contain up to 96 records
//? helper function to break array into chunks of size batchSize
const batchSize = 96;
function chunksArr(array, size) {
    const chunks = [];

    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    // console.log(chunks);
    // console.log(`chunks typeof: ${typeof(chunks)}`);

    return chunks;
}

async function upsertData() {
    //? get data to upsert
    let recs = await getDocs();

    //? since upsertRecords() taked input in array, we gonna bind all movie objects in an arr
    const recordsToUpsert = [];

    try{
        //? push one movie data at a time to the recordsToUpsert[]
        for await (let rec of recs) {
            // console.log(rec);
            // console.log(`val: ${rec.id} & typeof: ${typeof(rec.id)}`);

            //! do not add whole obj, we only need few key-val pairs as per the data model
            // recordsToUpsert.push(rec);
            //* fix:
            recordsToUpsert.push({
                _id: rec.id,
                //? will converted to vector embedding
                chunk_text: rec.chunk_text,
                //? optional metadata - filter searches
                metadata_country: rec.country,
                metadata_accountTier: rec.accountTier,
                metadata_totalOrders: rec.totalOrders,
            });
        }
        console.log(`✅ recordsToUpsert[] ready for Pinecone Upserting`);


        //! When upserting records with text, a batch can contain up to 96 records
        console.log(`⏳ Making chunks outta recordsToUpsert[]...`);

        let chunks = chunksArr(recordsToUpsert, batchSize);
        
        console.log(`⏳ Records are being Upserted...`);

        //? Upsert data with 96 records per upsert request
        for (const chunk of chunks) {
            // console.log(`${JSON.stringify(chunk)}`);
            await namespace.upsertRecords(chunk);
            console.log(`✅ Upserted batch of ${chunk.length}`);
        }

        console.log("✅ All data upsert complete");
        
        //! not working do not run
         //? since upsertRecords() is asking for an arr, we gonna give it an arr
         //// await namespace.upsertRecords(recordsToUpsert);
         //// console.log(`✅ Data upsert complete`);
    }
    catch(err) {
        console.error("❌ Error in Upserting data to Pinecone");
        console.error("❌ Error from 'upsertDocs.js': ", err);
    }
}

upsertData();

export default upsertData;