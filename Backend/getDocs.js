//* Fetch Data from MongoDB

// import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();


//? connect to DB
const client = new MongoClient(process.env.CONNECTION_STR_VECTOR);

//* helper function for customerData collection
//? converts customer object into chunk_text
function getCustomerChunkText(obj) {
    if (!obj) return 
    // Extract important fields
    const firstName = obj.personal_info?.first_name;
    const lastName = obj.personal_info?.last_name;
    //? convert raw data to JS Date object
    const dateObj = new Date(obj.personal_info?.join_date?.$date);
    //? format: "Mon Jan 15 2024"
    const joinDate = dateObj.toDateString();

    const email = obj.contact_info?.email;
    const phone = obj.contact_info?.phone;
    const secondaryEmail = obj.contact_info?.secondary_email;

    const city = obj.address?.city;
    const state = obj.address?.state;
    const country = obj.address?.country;

    let ordersText;
    if(Array.isArray(obj.orders) && obj.orders.length > 0) {
        ordersText = obj.orders.map((ord) => {
            let orderId = ord?.order_id;
            //? convert raw data to JS Date object
            let dateObjO = new Date(ord?.order_date?.$date);
            //? convert raw data to JS Date object
            let orderDate = dateObjO.toDateString();
            let totalAmount  = ord?.total_amount;
            let status = ord?.status;

            return `${status} order of $${totalAmount} on ${orderDate} with orderID:${orderId}`;
        }).join("; ");
    } else {
        ordersText = "No orders";
    }

    const accountTier = obj.metadata?.account_tier;
    //? convert raw data to JS Date object
    const dateObjM = new Date(obj.metadata?.last_login?.$date);
    //? convert raw data to JS Date object
    const lastLogin = dateObjM.toDateString();

	// Flatten nested objects
	// Convert dates
	// Join orders
	// Build a human-readable description
    return ` Customer ${firstName} ${lastName} from ${city}, ${state}, ${country} joined on ${joinDate}. Email: ${email}. Phone: ${phone}. Secondary Email: ${secondaryEmail}. Account tier: ${accountTier}. Last login: ${lastLogin}. Orders: ${ordersText}.`;
}


//? fucntion
async function getDocs() {
    try {
        //? connect to DB & get collection
        await client.connect();
        console.log(`✅ DB connection successful`);
        const database = client.db("sample_mflix");
        //? movie collection
        // const coll = database.collection("embedded_movies");
        //? customers collections
        const coll = database.collection("customerData");

        //? query docs one by one
            //? movie collection 
        // const movieRec = coll.find({'plot' : {$exists: true} });
        // console.log(`Doc: ${doc}`);
            //? customers collection
        const customersRec = coll.find({}); // returns cursor
        const records = [];

        //? push data to record arr
            //? movie collection 
        // for await (let movie of movieRec) {
        //     let movieData = {
        //         //? Convert ObjectId (BSON) to string
        //         id: movie._id.toString(),
        //         title: movie.title,
        //         plot: movie.plot, 
        //         genres: movie.genres,
        //         rated: movie.rated,
        //         year: movie.year,
        //         countries: movie.countries,
        //         type: movie.type
        //     };
        //     records.push(movieData);
        // }
            //? customers collection
        for await (let customer of customersRec) {
            let chunk_text = getCustomerChunkText(customer);
            records.push({
                // ID
                id: customer._id.toString(),
                chunk_text: chunk_text,
                // optional metadata
                tier: customer.metadata?.account_tier || "",
                city: customer.address?.city || "",
            });
        }

        console.log(`✅ Data pushed to records[]`);
        // console.log(records);
        console.log("records[] len: ", records.length);

        return records;
    }
    catch(err) {
        console.error("❌ Error in get data from MongoDB");
        console.error("❌ Error from 'getDocs.js': ", err);
    }
    finally {
        await client.close();
    }
}

// getDocs().catch((err) => console.error("❌ Error: ", err));

export default getDocs;