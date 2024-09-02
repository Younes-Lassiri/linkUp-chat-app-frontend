import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Signup from './components/Signup/Signup';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import { useContext, useEffect } from 'react';
import { UserContext } from './context/UserContext';
import Loader from './Loader/Loader';
import { axiosClient } from './api/axios';
function App() {
  const { user, setUser, logged, setLogged, loginLoading, setLoginLoading } = useContext(UserContext);
  if(loginLoading){
    return <Loader/>
  }
  return (
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<Signup/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/dashboard' element={<Dashboard/>}/>
    </Routes>
    </BrowserRouter>
  );
}

export default App;
