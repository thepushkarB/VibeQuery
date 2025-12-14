import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

async function pineconeIndex() {
  try {
    await pc.createIndexForModel({
      // name: 'integrated-dense-js',
      name: process.env.CUSTOMERS_INDEX_NAME,
      cloud: 'aws',
      region: 'us-east-1',
      embed: {
        model: 'llama-text-embed-v2',
        /**
         * `fieldMap` :- For every object sent, you must find a field named `chunk_text`, extract its text, and create the embedding yourself         
        */
        fieldMap: { text: 'chunk_text' },
      },
      waitUntilReady: true,
    });
    console.log("✅ Success, Pinecone Indexing done\n");

    //* similarity function: cosine(default by Pinecone)
  }
  catch(err) {
    console.error("❌ Error in Pinecone Indexing");
    console.error("❌ Error from 'pineconeIndex.js': ", err);
  }

}

pineconeIndex();

export default pineconeIndex;