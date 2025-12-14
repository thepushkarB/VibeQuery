import React, { useState, useEffect } from 'react'
import LoadingSpinner from './LoadingSpinner.jsx';


function Search() {

    //* UI state
    //? for input query
    const [inputText, setInputText] = useState("");
    //? for click button
    const [isClicked, setIsClicked] = useState(false);
    //? for Loading Spinenr
    const [isLoading, setIsLoading] = useState(false);
    //? for Error Box
    const [error, setError] = useState(null);

    //? response data (raw, as returned from API)
    const [searchResults, setSearchResults] = useState({});
    

    //? for Show Movie / Detail View
    const [isShowMovie, setIsShowMovie] = useState(false)
    //? single movie data
    const [movieData, setMovieData]  = useState({});

    //? Relevance slider
    const [slider, setSlider] = useState(1);

    //? data source: now an array (multi-select). Default to Movies only.
    const [dataSource, setDataSource] = useState(["embedded_movies"]);
    function handleDataSources( str ) {
        setDataSource(prevArr => {
            //? not used splice() cos mutated the original arr
            //? used `filter()` cos it returns new arr 
            //? `...(spread operator)` to genenrate new arr w/ new str ele 
            return prevArr.includes(str) 
                // remove
                ? prevArr.filter(ele => ele !== str) 
                // add/merge
                : [...prevArr, str]
        });
    }

    useEffect(() => {
        // This effect runs after a re-render when `slider` val changes.
        // It will correctly log the updated state.
        if (movieData && Object.keys(movieData).length > 0) {
            // console.log("movieData has been updated:", movieData);
        }

        if (Object.keys(searchResults).length === 0) return; // nothing to sort

        const sortedResults = {};
        //? iterated over dataSources(collections)
        for (const source in searchResults) {
            // console.log('searchResults[source]: ', searchResults[source]);
            // console.log('searchResults[source].data: ', searchResults[source].data);
            if (searchResults[source].data) {
                const sortedData = [...searchResults[source].data].sort((a, b) => {
                    return slider == 1 ? b.relevancyScore - a.relevancyScore : a.relevancyScore - b.relevancyScore
                });
                sortedResults[source] = { ...searchResults[source], data: sortedData };
            } else {
                sortedResults[source] = searchResults[source];
            }
        }

        setSearchResults(sortedResults);

    }, [slider]);

    // this function only schedules the state updates.
    function handleShowMovie(item) {
        setMovieData(item);
        setIsShowMovie(true);
    }


    //? Search - API call
    async function handleSearch(e) {
        e.preventDefault();

        if (!inputText.trim()) {
            setSearchResults({});
            setIsLoading(false);
            setError("Please enter your query");
            setTimeout(() => {
                setError(null);
            }, 2000);
            return;
        }

        setError(null);
        setIsLoading(true);
        setIsClicked(true);
        setSearchResults({});

        const searchPromises = dataSource.map(source => {
            let url;
            if (source === 'embedded_movies') {
                url = 'http://localhost:5001/api/movies/search';
            } else if (source === 'customerData') {
                url = 'http://localhost:5001/api/customers/search';
            } else {
                return Promise.resolve({ source, error: 'Unknown data source' });
            }

            const requestOptions = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "sQuery": inputText }),
                redirect: "follow"
            };

            return fetch(url, requestOptions)
                .then(async response => {
                    if (response.status === 204) {
                        return { source, results: [], count: 0 };
                    }
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ msg: 'Failed to parse error response' }));
                        throw new Error(`Server error for ${source}: ${response.status} - ${errorData.msg}`);
                    }
                    return response.json();
                })
                .then(data => ({...data, source: data.source || source}))
                .catch(error => ({ source, error: error.message }));
        });

        const results = await Promise.all(searchPromises);

        const newSearchResults = {};
        results.forEach(result => {
            if (result.error) {
                newSearchResults[result.source] = { data: [], count: 0, error: result.error };
            } else {
                newSearchResults[result.source] = { data: result.results, count: result.count, error: null };
            }
        });
        
        setSearchResults(newSearchResults);
        setIsLoading(false);
        setInputText("");
    }

    //* Rneder
    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center dark:bg-gray-900 dark:text-neutral-100 font-mono ">
            <h1 className="text-6xl pb-6 font-bold">Vibe Query</h1>

            {/* Search */}
            <form
                onSubmit={handleSearch}
                className="flex items-center gap-3 w-full max-w-2xl"
            >
                {/* Search Icon + Input */}
                <div className="relative flex-1">
                    <svg
                        className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 20"
                    >
                        <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                        />
                    </svg>

                    <input
                        id="search"
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-md focus:ring-rose-500 focus:border-rose-500"
                        placeholder="Type your query..."
                    />
                </div>

                {/* Filter(Multi-select) Dropdown */}
                <div className="relative">
                    <details className='dropdown'>
                        <summary className="px-3 py-3 rounded-lg bg-rose-700 text-white cursor-pointer hover:bg-rose-800 transition ease-in-out duration-200">
                            Data Source({dataSource.length}):
                        </summary>
                        
                        <ul className="menu dropdown-content bg-rose-300 rounded-lg shadow-md p-3 w-auto text-black ">
                            <li>
                                <label className='flex items-center gap-2 hover:bg-rose-500'>
                                    <input 
                                        type="checkbox" 
                                        checked={dataSource.includes("embedded_movies")} 
                                        value="embedded_movies" 
                                        onChange={(e) => handleDataSources(e.target.value)}
                                    /> Movies
                                </label>
                            </li>
                            <li>
                                <label className='flex items-center gap-2 hover:bg-rose-500'>
                                    <input 
                                        type="checkbox"  
                                        checked={dataSource.includes("customerData")} 
                                        value="customerData" 
                                        onChange={(e) => handleDataSources(e.target.value)}
                                    /> Customers 
                                </label>
                            </li>
                        </ul>
                    </details>
                </div>

                {/* Search Button */}
                <button
                    type="submit"
                    className="px-5 py-3 rounded-lg bg-rose-700 text-white font-semibold hover:bg-rose-800 shadow-md transition active:scale-95 hover:cursor-pointer"
                >
                    Search
                </button>
            </form>

            {/* Loading Spiner */}
            {isLoading && ( <LoadingSpinner /> )}

            {/* Result/Content */}
            {Object.keys(searchResults).length > 0 && (
                <div className='w-full max-w-4xl mt-8 relative'>
                    {/* Slider */}
                    <div className='flex flex-col items-center justify-center mt-5 w-1/6 ml-auto'>
                        <label htmlFor="steps-range" className="block text-sm font-bold">Relevance Range(0-1)</label>
                        <input
                            id="steps-range"
                            type="range"
                            min="0" max="1" value={slider} step="1"
                            className=" h-2 bg-neutral-300 rounded-full appearance-none cursor-pointer mt-1"
                            onChange={(e) => setSlider(e.target.value)}
                        />
                    </div>

                    <div className={`transition-filter duration-300 flex flex-col items-center justify-center overflow-x-auto overflow-auto ${isShowMovie ? 'filter blur-sm z-0' : ''}`}>
                        {Object.entries(searchResults).map(([source, { data, count, error }]) => (
                            <div key={source} className="mt-6">
                                <h2 className="text-2xl font-bold mb-2 capitalize">{source.replace('_', ' ')}</h2>
                                {error && <p className="text-red-500">❌ {error}</p>}
                                {!error && count === 0 && <p className="text-gray-500">❌ No results found</p>}
                                {data && data.length > 0 && (
                                    <div className="overflow-x-auto">
                                        <table className="table w-full mt-3 table-auto border-separate border-2 rounded-lg shadow-xl shadow-gray-400">
                                            {/* Movies Table Head */}
                                            {source === 'embedded_movies' && (
                                                <thead className=' text-gray-900 border-2 bg-gray-400 dark:bg-gray-700 '>
                                                    <tr>
                                                        <th className="border-2 p-2 rounded-sm">Title</th>
                                                        <th className="border-2 p-2 rounded-sm">Genres</th>
                                                        <th className="border-2 p-2 rounded-sm">Plot</th>
                                                        <th className="border-2 p-2 rounded-sm">Directors</th>
                                                        <th className="border-2 p-2 rounded-sm">Year</th>
                                                        <th className="border-2 p-2 rounded-sm">Relevancy Score</th>
                                                    </tr>
                                                </thead>
                                                // Customers Table Head
                                            )}
                                            {source === 'customerData' && (
                                                <thead className='text-gray-900 border-2 bg-gray-400 dark:bg-gray-700 '>
                                                    <tr>
                                                        <th className=" p-2 rounded-sm">Name</th>
                                                        <th className=" p-2 rounded-sm">Email</th>
                                                        <th className=" p-2 rounded-sm">City</th>
                                                        <th className=" p-2 rounded-sm">Account Tier</th>
                                                        <th className=" p-2 rounded-sm">Relevancy Score</th>
                                                    </tr>
                                                </thead>
                                            )}
                                            <tbody>
                                                {data.map((item) => (
                                                    <tr key={item._id} className="hover:bg-gray-200 dark:hover:bg-gray-800 transition ease-in-out duration-200 cursor-pointer hover:scale-101 hover:rounded-lg" onClick={() => handleShowMovie(item)}>
                                                        {source === 'embedded_movies' && (
                                                            <>
                                                                <td className='border-2 p-3 rounded-sm'>{item.title}</td>
                                                                <td className='border-2 p-3 rounded-sm'>{Array.isArray(item.genres) ? item.genres.join(", ") : item.genres}</td>
                                                                <td className='border-2 p-3 rounded-sm'>{item.plot}</td>
                                                                <td className='border-2 px-3 py-2 rounded-sm'>{Array.isArray(item.directors) ? item.directors.join(", ") : item.directors}</td>
                                                                <td className='border-2 px-3 py-2 rounded-sm'>{item.year}</td>
                                                                <td className='border-2 px-3 py-2 rounded-sm'>
                                                                    <div className='flex flex-col items-center justify-center'>
                                                                        {(Math.round(item.relevancyScore.toFixed(2) * 100) + "%")}
                                                                        <progress
                                                                            className="progress progress-error w-30"
                                                                            value={(Math.round(item.relevancyScore.toFixed(2) * 100))}
                                                                            max="100"
                                                                        ></progress>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}
                                                        {source === 'customerData' && (
                                                            <>
                                                                <td className='border-2 p-3 rounded-sm'>{`${item.personal_info.first_name} ${item.personal_info.last_name}`}</td>
                                                                <td className='border-2 p-3 rounded-sm'>{item.contact_info.email}</td>
                                                                <td className='border-2 p-3 rounded-sm'>{item.address.city}</td>
                                                                <td className='border-2 p-3 rounded-sm'>{item.metadata.account_tier}</td>
                                                                <td className='border-2 px-3 py-2 rounded-sm'>
                                                                    <div className='flex flex-col items-center justify-center'>
                                                                        {(Math.round(item.relevancyScore.toFixed(4) * 100) + "%")}
                                                                        <progress
                                                                            className="progress progress-error w-30"
                                                                            value={(Math.round(item.relevancyScore.toFixed(4) * 100))}
                                                                            max="100"
                                                                        ></progress>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Movie Details box */}
                    {isShowMovie && movieData && (
                         <div className="w-3/4 h-auto flex flex-col mt-2 p-1 border-2 border-gray-300 bg-gray-100 rounded-lg shadow-lg shadow-gray-400 mb-0 overflow-auto absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 dark:bg-gray-900">
                            {/* ID */}
                            <div className='flex'>
                                <div className="w-full hover:bg-gray-200 hover:cursor-pointer hover:scale-101 transition ease-in-out duration-200 rounded-lg p-2 flex items-end dark:hover:bg-gray-800">
                                    <span className="font-bold mr-4 text-rose-700 ">Id:</span>
                                    <span>{movieData._id}</span>
                                </div>
                                <div
                                    className='w-auto h-auto m-1 p-1 rounded-lg hover:bg-rose-200 hover:cursor-pointer transition ease-in-out duration-200 hover:scale-110'
                                    onClick={() => setIsShowMovie(false)}
                                >❌</div>
                            </div>

                            {/* Render based on data type */}
                            {movieData.title && ( // It's a movie
                                <>
                                    {/* title */}
                                    <div className="w-full hover:bg-gray-200 hover:cursor-pointer hover:scale-101 transition ease-in-out duration-200 rounded-md p-2 dark:hover:bg-gray-800">
                                        <span className="font-bold mr-4 text-rose-700 ">Title:</span>
                                        <span>{movieData.title}</span>
                                    </div>
                                     {/* genres */}
                                    <div className="w-full hover:bg-gray-200 hover:cursor-pointer hover:scale-101 transition ease-in-out duration-200 rounded-md p-2 flex dark:hover:bg-gray-800">
                                        <span className="font-bold mr-4 text-rose-700 ">Genres:</span>
                                        <span className='flex'> {movieData.genres?.map((genre, index) => <ul key={index}>{index === movieData.genres.length - 1 ? <li>{genre}</li> : <li>{genre}, </li>}</ul>)}</span>
                                    </div>
                                    {/* plot */}
                                    <div className="w-full hover:bg-gray-200 hover:cursor-pointer hover:scale-101 transition ease-in-out duration-200 rounded-md p-2 dark:hover:bg-gray-800">
                                        <span className="font-bold mr-4 text-rose-700 ">Full Plot:</span>
                                        <span>{movieData.fullplot}</span>
                                    </div>
                                    {/* directors */}
                                    <div className="w-full hover:bg-gray-200 hover:cursor-pointer hover:scale-101 transition ease-in-out duration-200 rounded-md p-2 flex dark:hover:bg-gray-800">
                                        <span className="font-bold mr-4 text-rose-700 ">Directors:</span>
                                        <span className='flex'> {movieData.directors?.map((director, index) => <ul key={index}>{index === movieData.directors.length - 1 ? <li>{director}</li> : <li>{director}, </li>}</ul>)}</span>
                                    </div>
                                    {/* Year */}
                                    <div className="w-full hover:bg-gray-200 hover:cursor-pointer hover:.scale-101 transition ease-in-out duration-200 rounded-md p-2 dark:hover:bg-gray-800">
                                        <span className="font-bold mr-4 text-rose-700 ">Release Year:</span>
                                        <span>{movieData.year}</span>
                                    </div>
                                    {/* Actor */}
                                    <div className="w-full hover:bg-gray-200 hover:cursor-pointer hover:scale-101 transition ease-in-out duration-200 rounded-md p-2 flex dark:hover:bg-gray-800">
                                        <span className="font-bold mr-4 text-rose-700 ">Cast:</span>
                                        <span className='flex'> {movieData.cast?.map((actor, index) => <ul key={index}>{index === movieData.cast.length - 1 ? <li>{actor}</li> : <li>{actor}, </li>}</ul>)}</span>
                                    </div>
                                    {/* Country */}
                                    <div className="w-full hover:bg-gray-200 hover:cursor-pointer hover:scale-101 transition ease-in-out duration-200 rounded-md p-2 flex dark:hover:bg-gray-800">
                                        <span className="font-bold mr-4 text-rose-700 ">Countries:</span>
                                        <span className='flex'> {movieData.countries?.map((country, index) => <ul key={index}>{index === movieData.countries.length - 1 ? <li>{country}</li> : <li>{country}, </li>}</ul>)}</span>
                                    </div>
                                </>
                            )}
                            {movieData.personal_info && ( // It's a customer
                                <>
                                    {/* Name */}
                                    <div className="w-full hover:bg-gray-200 hover:cursor-pointer hover:scale-101 transition ease-in-out duration-200 rounded-md p-2 dark:hover:bg-gray-800">
                                        <span className="font-bold mr-4 text-rose-700 ">Name:</span>
                                        <span>{`${movieData.personal_info.first_name} ${movieData.personal_info.last_name}`}</span>
                                    </div>
                                    {/* Email */}
                                    <div className="w-full hover:bg-gray-200 hover:cursor-pointer hover:scale-101 transition ease-in-out duration-200 rounded-md p-2 dark:hover:bg-gray-800">
                                        <span className="font-bold mr-4 text-rose-700 ">Email:</span>
                                        <span>{movieData.contact_info?.email}</span>
                                    </div>
                                    {/* Phone */}
                                    <div className="w-full hover:bg-gray-200 hover:cursor-pointer hover:scale-101 transition ease-in-out duration-200 rounded-md p-2 dark:hover:bg-gray-800">
                                        <span className="font-bold mr-4 text-rose-700 ">Phone:</span>
                                        <span>{movieData.contact_info?.phone}</span>
                                    </div>
                                    {/* Address */}
                                    <div className="w-full hover:bg-gray-200 hover:cursor-pointer hover:scale-101 transition ease-in-out duration-200 rounded-md p-2 dark:hover:bg-gray-800">
                                        <span className="font-bold mr-4 text-rose-700 ">Address:</span>
                                        <span>{`${movieData.address?.street}, Zip code: ${movieData.address?.zip_code}, ${movieData.address?.city}, ${movieData.address?.country}`}</span>
                                    </div>
                                    {/* Accoutn Tier */}
                                    <div className="w-full hover:bg-gray-200 hover:cursor-pointer hover:scale-101 transition ease-in-out duration-200 rounded-md p-2 dark:hover:bg-gray-800">
                                        <span className="font-bold mr-4 text-rose-700 ">Account Tier:</span>
                                        <span>{movieData.metadata?.account_tier}</span>
                                    </div>
                                    {/* Joining Date */}
                                    <div className="w-full hover:bg-gray-200 hover:cursor-pointer hover:scale-101 transition ease-in-out duration-200 rounded-md p-2 dark:hover:bg-gray-800">
                                        <span className="font-bold mr-4 text-rose-700 ">Joining Date:</span>
                                        <span>{new Date(movieData.personal_info?.join_date).toLocaleDateString()}</span>
                                    </div>
                                    {/* Order Info */}
                                    <details className="w-full hover:bg-gray-200 hover:cursor-pointer hover:scale-101 transition ease-in-out duration-200 rounded-md p-2 dark:hover:bg-gray-800">
                                        <summary className="font-bold mr-4 text-rose-700 ">Order History</summary>
                                        {movieData.orders?.map((order, index) => (
                                            <div key={index} className="mt-2 p-2 border-t border-gray-300">
                                                <p><span className="font-semibold">Order ID:</span> {order.order_id}</p>
                                                <p><span className="font-semibold">Date:</span> {new Date(order.order_date).toLocaleDateString()}</p>
                                                <p><span className="font-semibold">Total:</span> ${order.total_amount}</p>
                                                <p><span className="font-semibold">Status:</span> {order.status}</p>
                                            </div>
                                        ))}
                                    </details>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Error box: No Results */}
            {error && (
                <div className='w-auto h-auto border border-gray-400 rounded-lg mt-7 bg-gray-100 shadow-md shadow-gray-400 transition-transform ease-in-out duration-300 dark:bg-gray-700 dark:text-neutral-100'>
                    <div className='w-full h-8 bg-rose-700 rounded-t-md p-1 pl-3 text-neutral-100 font-bold'>Error!</div>
                    <p className='p-1 px-2 mb-2'>{error}</p>
                </div>
            )}
        </div>

    )
}

export default Search;
