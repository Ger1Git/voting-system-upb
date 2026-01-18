import { Outlet } from 'react-router-dom';
import Navigation from './components/Navigation';

const Layout = () => {
    return (
        <div className='bg-tertiary relative flex flex-col min-h-screen'>
            <Navigation />
            <div className='flex justify-center my-8 lg:my-12'>
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
