import './styles/styles.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Layout from './Layout';
import Trips from './components/Trips/Trips';
import TripDetails from './components/Trips/TripDetails';
import AdminTripReview from './components/Trips/AdminTripReview';
import TripGenerator from './components/TripGenerator/TripGenerator';
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
                    <Route index element={isAuthenticated ? <Navigate to='/trips' /> : <Navigate to='/login' />} />
                    <Route path='/dashboard' element={<Navigate to='/trips' />} />
                    <Route path='/trips' element={<AuthRoute element={Trips} requireAuth={true} />} />
                    <Route path='/trips/:id' element={<AuthRoute element={TripDetails} requireAuth={true} />} />
                    <Route path='/trips/review' element={<AuthRoute element={AdminTripReview} requireAuth={true} />} />
                    <Route path='/trip-generator' element={<AuthRoute element={TripGenerator} requireAuth={true} />} />
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
