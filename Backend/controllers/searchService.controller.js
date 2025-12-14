//* Search Query Service - text query
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();
import { MongoClient, ObjectId } from "mongodb";

const pc = new Pinecone({apiKey: process.env.PINECONE_API_KEY});

const namespace = pc.index(process.env.INDEX_NAME, process.env.INDEX_HOST).namespace("__default__");
const namespaceCustomer = pc.index(process.env.CUSTOMERS_INDEX_NAME, process.env.CUSTOMERS_INDEX_HOST).namespace("__default__");

//? set DB client

//? get movies data:
export const searchMovies = async(req, resp) => {
    const client = new MongoClient(process.env.CONNECTION_STR);
    try {
        const moviesRes = {
            source: "embedded_movies",
            results: [],
            count: 0
        };
        //* step-0: get the search query
        const {sQuery} = req.body;
        // if (!sQuery || !sQuery.trim()) {
        //     return resp.status(400).json({ msg: "Search query is required" });
        // }

        //* Step-1: get info from pinecone for searched query
        // const resp = await namespace.searchRecords({
        const pineconeResp = await namespace.searchRecords({
            query: {
                topK: 3,
                //? search query text
                // inputs: { text: 'Sci-fi movies' },
                inputs: { text: sQuery },
            },
            //? fields to return in the response.
            //? If not specified, the response will include all fields.
            fields: ['_id'],
        });
        console.log(`✅ Pinecone Search Successful`);
        /*
        ? `pineconeResp` object str:
            {
                result: { hits: [ [Object], [Object], [Object] ] },
                usage: { readUnits: 1, embedTotalTokens: 6, rerankUnits: undefined }
            }   

            ? `hits` is an array consiting of objects
            ? each `obj` has:
                -> _id
                -> _score
                -> fields object
                    -> chunk_text(movie plot)   
        */

        //* Step-2: disintegrate the data package to get IDs & relevancy scores
        const IDs = [];
        const scores = [];
        console.log(`⏳ Getting IDs...`);
        for await (let obj of pineconeResp.result.hits) {
            // console.log(obj);
            IDs.push(obj._id);
            // This is the relevance score
            scores.push(obj._score);
        }

        //* Step-3: fetch data from mongoDB
        //? connect to DB
        await client.connect();
        console.log(`✅ DB connection successful`);
        //? get db & coll from the cluster
        const database = client.db("sample_mflix");
        const coll = database.collection("embedded_movies");
        //? get data
        for (let i = 0; i < IDs.length; i++) {
            const id = IDs[i];
            const score = scores[i];

            //? Find movie document
            const movie = await coll.findOne(
                { _id: new ObjectId(id) },
                { projection: { plot_embedding: 0, plot_embedding_voyage_3_large: 0 } }
            );

            if (!movie) {
                console.log(`⚠️ No movie found for ID: ${id}`);
                //? skip rest of the code & conti. w/ nect id
                continue;
            }

            //? Attach relevancy score
            console.log("⏳ appending relevancy score....");
            movie.relevancyScore = score;

            // Push to results array
            moviesRes.results.push(movie);
        }
        //? final response object
        moviesRes.count = moviesRes.results.length;
        return resp.status(200).json(moviesRes)
        // console.log(`✅ Final Movies Response:`, moviesRes);
    }
    catch(err) {
        console.error("❌ Error in Search Service.");
        console.error("❌ Error from searchService.js > searchMovies(): ", err);
        response.status(500).send({ msg: err.message });
    }
    finally {
        await client.close();
        // console.log("🔌 MongoDB Connection Closed");
    }
}


//? get customer data
export const searchCustomers = async(req, resp) => {
    const client = new MongoClient(process.env.CONNECTION_STR);
    try {
        const customersRes = {
            source: "customerData",
            results: [],
            count: 0
        }
        //* step-0: get the search query
        const { sQuery } = req.body;
        // if (!sQuery || !sQuery.trim()) {
        //     return resp.status(400).json({ msg: "Search query is required" });
        // }

        //* Step-1: get info from pinecone for searched query
        const pineconeResp = await namespaceCustomer.searchRecords({
            query: {
                topK: 3,
                inputs: { text: sQuery },
            },
            rerank: {
                model: 'bge-reranker-v2-m3',
                topN: 3,
                rankFields: ['chunk_text']
            },
            fields: ['_id'],
        });
        console.log(`✅ Pinecone Search Successful`);

        //* Step-2: disintegrate the data package to get IDs & relevancay score
        const IDs = [];
        const scores = [];
        if(!pineconeResp?.result?.hits.length > 0) {
            console.log("ℹ️ Pinecone returned zero hits.");
            return resp.status(204).json(customersRes);
        }
        console.log(`⏳ Getting IDs...`);
        for await (let obj of pineconeResp.result.hits) {
            IDs.push(obj._id);
            scores.push(obj._score);
        }

        //* Step-3: fetch data from mongoDB
        await client.connect();
        const database = client.db("sample_mflix");
        const coll = database.collection("customerData");
        for (let i = 0; i < IDs.length; i++) {
            const id = IDs[i];
            const score = scores[i];

            const customer = await coll.findOne({ _id: new ObjectId(id)});
            if(!customer) {
                console.log(`⚠️ No cutomer found for ID: ${id} `);
                continue;
            }

            console.log("⏳ appending relevancy score....");
            customer.relevancyScore = score;
            // console.log("cutomer: ",customer);
            customersRes.results.push(customer);
        }

        customersRes.count = customersRes.results.length;
        return resp.status(200).json(customersRes);
    }
    catch(err) {
        console.error("❌ Error in Search Service.");
        console.error("❌ Error from searchService.js > searchCustomers(): ", err);
        response.status(500).send({ msg: err.message });
    }
    finally {
        await client.close();
        // console.log("🔌 MongoDB Connection Closed");
    }
}


// async function searchService(req, response) {
//     try {
//         console.log(req.body)
//         //* step -0: get the search query
//         const {sQuery} = req.body;

//         //* Step-1: get info from pinecone for searched query
//         const resp = await namespace.searchRecords({
//             query: {
//                 topK: 3,
//                 //? search query text
//                 // inputs: { text: 'Sci-fi movies' },
//                 inputs: { text: sQuery },
//             },
//             //? fields to return in the response.
//             //? If not specified, the response will include all fields.
//             fields: ['_id', 'chunk_text'],
//         });
//         console.log(`✅ Search query successfull`)
//         // console.log(resp.result.hits);
        

//         // console.log(typeof(resp));
//         // console.log(typeof(resp.result.hits));
//         /*
//         ? resp object str:
//             {
//                 result: { hits: [ [Object], [Object], [Object] ] },
//                 usage: { readUnits: 1, embedTotalTokens: 6, rerankUnits: undefined }
//             }   

//             ? `hits` is an array consiting of objects
//             ? each `obj` has:
//                 -> _id
//                 -> _score
//                 -> fields object
//                     -> chunk_text(movie plot)   
//         */



//         //* Step-2: disintegrate the data package to get IDs
//         const IDs = [];
//         const scores = [];
//         console.log(`⏳ Getting IDs...`);
//         for await (let obj of resp.result.hits) {
//             // console.log(obj);
//             IDs.push(obj._id);
//             // This is the relevance score
//             scores.push(obj._score);
//         }
//         // console.log(IDs);



//         //* Step-3: fetch data from mongoDB
//         //? connect to DB
//         await client.connect();
//         console.log(`✅ DB connection successful`);

//         //? get databas & collection from cluster
//         const database = client.db("sample_mflix");
//         const { dataSource } = req.body;
//         console.log(`💿 dataSource: ${dataSource}`);
//         //// const coll = database.collection("embedded_movies");
//         // const coll = database.collection(dataSource);
        
//         console.log(`⏳ Getting data from the DB...`);
        
//         //? get the required data
//         const queryRes = [];
        

//         let count = 0;
//         let collName;
//         //? map() is not async wait -> always use `for..of loop ` w/ await 
//         for (let ds of dataSource) {
//             const coll = database.collection(ds);
//             await getData(coll);
//             collName = coll.collectionName;
//             // console.log("coll: ", coll.collectionName);
//             console.log(`executed getData()`);
//         }
//         // console.log("✅ Matching movies data found ");

//         async function getData(coll) {
//             for await (let id of IDs) {
//                 const movie = await coll.find({ _id: new ObjectId(id) }).toArray();
//                 count++;
//                 if (movie.length === 0) {
//                     // throw new Error("No data found");
//                     console.log(`No data found}`);

//                     // queryRes.push([`No data found in ${dataSource[count]}`] );
//                     console.log("bakakakakakaakakakaakakakakakak")
//                     return;
//                 }

//                 console.log("⏳ appending relevancy score....");
//                 //? adding `relevancyScore` prop to movie obj; str -> [{...}]
//                 movie[0].relevancyScore = scores[0];
//                 //? remove first ele form scores[]
//                 scores.shift();
//                 //? push it queryRes which con tains all fetch movies from DB; str -> [ [{...}], [{...}] ]
//                 // console.log("Movie: ", movie.flat());
//                 queryRes.push(movie);
//                 // console.log(movie[0].relevancyScore = scores[0])
//                 // console.log(movie[0]._id);
//                 // if(movie[0].relevancyScore) {
//                 //     console.log(movie[0].relevancyScore);
//                 // }
//             }
//         }
        
//         // for await (let id of IDs) {
//         //     const movie = await coll.find({ _id: new ObjectId(id) }).toArray();
//         //     if(movie.length === 0) {
//         //         throw new Error("No data found");
//         //     }

//         //     console.log("⏳ appending relevancy score....");
//         //     //? adding `relevancyScore` prop to movie obj; str -> [{...}]
//         //     movie[0].relevancyScore = scores[0];
//         //     //? remove first ele form scores[]
//         //     scores.shift();
//         //     //? push it queryRes which contains all fetch movies from DB; str -> [ [{...}], [{...}] ]
//         //     queryRes.push(movie);
//         //     // console.log(movie[0].relevancyScore = scores[0])
//         //     // console.log(movie[0]._id);
//         //     // if(movie[0].relevancyScore) {
//         //     //     console.log(movie[0].relevancyScore);
//         //     // }
//         // }

//         // console.log(`queryRes: ${JSON.stringify(queryRes)}`);
//         // console.log(typeof(queryRes));
//         // return queryRes;
//         // console.log("queryRes: ", queryRes.flat());
//         console.log("✅ All data fetched");
//         //// since data is received in nested/muli-dimensional array we gotta flaten it
//         // response.status(200).json({collName: queryRes.flat()});
//         response.status(200).json(queryRes);
//         // console.log(queryRes);

//     }
//     catch(err) {
//         console.error("❌ Error in Search Service.");
//         console.error("❌ Error from 'searchService.js': ", err);
//         response.status(500).send({ msg: err.message });
//     }
//     finally {
//         await client.close();
//     }
// }


// searchService().catch((err) => console.error("❌ Error: ", err));

// export default searchService;