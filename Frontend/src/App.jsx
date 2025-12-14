import { Routes, Route } from 'react-router-dom';
import Search from './components/Search';
// import SearchOG from './components/SearchOG';

function App() {

  return (
    <Routes>
      <Route path="/" element={<Search />} />
      {/* <Route path="/" element={<SearchOG />} /> */}
    </Routes>
  )
}

export default App
