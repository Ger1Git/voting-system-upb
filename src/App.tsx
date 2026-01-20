import './styles/styles.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Layout from './Layout';
import Buses from './components/Buses/Buses';
import Login from './components/Account/Login';
import Account from './components/Account/MyAccount';
import Register from './components/Account/Registration';
import AuthRoute from './components/Account/AuthRoute';

function App() {
    const isAuthenticated = !!Cookies.get('token');

    return (
        <>
            <Routes>
                <Route path='/' element={<Layout />}>
                    <Route index element={isAuthenticated ? <Navigate to='/buses' /> : <Navigate to='/login' />} />
                    <Route path='/buses' element={<AuthRoute element={Buses} requireAuth={true} />} />
                    <Route path='/account' element={<AuthRoute element={Account} requireAuth={true} />} />
                    <Route path='/login' element={<AuthRoute element={Login} requireAuth={false} />} />
                    <Route path='/register' element={<AuthRoute element={Register} requireAuth={false} />} />
                </Route>
            </Routes>
        </>
    );
}

export default App;
