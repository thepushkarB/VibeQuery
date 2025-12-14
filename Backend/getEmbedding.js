// import { pipeline } from "@xenova/transformers";
import { VoyageAIClient } from "voyageai";

//? Voyage AI configuration
// const vClient = new VoyageAIClient({ apikey: process.env.VOYAGE_API_KEY });
const vClient = new VoyageAIClient(process.env.VOYAGE_API_KEY);

//* function to generate embeddings using OS HF model
// async function getEmbedding(data) {
//     const embedder = await pipeline('feature-extraction', 'Xenova/nomic-embed-text-v1');
//     // console.log(`pipeline: ${pipeline}`);
//     console.log(`embedder: ${embedder}`);
//     const res = await embedder(data, { pooling: 'mean', normalize: true });
//     console.log(`res: ${res}`);
//     return Array.from(res.data);
// } 

//* function to generate embeddings using voyage-3-large
async function getEmbedding(text) {
    const res = await vClient.embed({
        input: text,
        model: "voyage-3-large"
    });

    //todo: ✅ embeddings are being geenrated 
    // console.log(`res: ${res}`);
    // console.log(`res: ${res.data[0]}`);
    // console.log(`res: ${res.data[0].embedding}`);
    return res.data[0].embedding;
}

export default getEmbedding;



// //* Mouhith code:
// import { VoyageAIClient } from "voyageai";

// const vClient = new VoyageAIClient({ apikey: process.env.VOYAGE_API_KEY });

// async function getEmbedding(text) {
//     const res = await vClient.embed({
//         input: text,
//         model: "voyage-3-large"
//     });

//     return res.data[0].embedding;
// }

// export default getEmbedding;