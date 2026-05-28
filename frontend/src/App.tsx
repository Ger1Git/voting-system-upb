import './styles/styles.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Layout from './Layout';
import Login from './components/Account/Login';
import Account from './components/Account/MyAccount';
import Register from './components/Account/Registration';
import AuthRoute from './components/Account/AuthRoute';
import FaceCheck from './components/Account/FaceCheck';
import CreateVoting from './components/Admin/CreateVoting';
import Votings from './components/Voting/Votings';
import VotingDetail from './components/Voting/VotingDetail';

function App() {
    const isAuthenticated = !!Cookies.get('token');

    return (
        <>
            <Routes>
                <Route path='/' element={<Layout />}>
                    <Route index element={isAuthenticated ? <Navigate to='/votings' /> : <Navigate to='/login' />} />
                    <Route path='/account' element={<AuthRoute element={Account} requireAuth={true} />} />
                    <Route path='/votings' element={<AuthRoute element={Votings} requireAuth={true} />} />
                    <Route path='/votings/:id' element={<AuthRoute element={VotingDetail} requireAuth={true} />} />
                    <Route path='/login' element={<AuthRoute element={Login} requireAuth={false} />} />
                    <Route path='/register' element={<AuthRoute element={Register} requireAuth={false} />} />
                    <Route path='/face-check' element={<AuthRoute element={FaceCheck} requireAuth={true} />} />
                    <Route path='/admin/create-voting' element={<AuthRoute element={CreateVoting} requireAuth={true} requireAdmin={true} />} />
                </Route>
            </Routes>
        </>
    );
}

export default App;
