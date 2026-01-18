import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import useRequestWithAuth from '../../hooks/useRequestWithAuth';
import { isAdmin } from '../../utils/jwt';
import { FaUserPlus } from 'react-icons/fa';

interface UserProfile {
    username: string;
    email: string;
    createdAt?: string;
}

const MyAccount = () => {
    const navigate = useNavigate();
    const { request } = useRequestWithAuth();
    const [userProfile, setUserProfile] = useState<UserProfile>({
        username: '',
        email: '',
    });
    const [adminStatus, setAdminStatus] = useState(false);

    useEffect(() => {
        fetchUserProfile();
        const admin = isAdmin();
        console.log('Admin status in MyAccount:', admin);
        setAdminStatus(admin);
    }, []);

    const fetchUserProfile = async () => {
        try {
            const userId = '123'; // Replace with actual userId
            const profile = await request<UserProfile>(`/user?userId=${userId}`, 'GET', null, true);
            setUserProfile(profile);
        } catch (error: any) {
            console.error('Failed to fetch user profile:', error);
        }
    };

    const handleLogout = () => {
        Cookies.remove('token');
        navigate('/login');
    };

    return (
        <div className='my-12 max-w-4xl mx-auto relative z-0'>
            <div className='bg-white p-8 rounded-lg shadow-lg'>
                <div className='flex justify-between items-center mb-6'>
                    <h1 className='text-3xl font-bold text-gray-800'>My Account</h1>
                </div>

                <div className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='bg-gray-50 p-4 rounded-md'>
                            <label className='text-sm font-medium text-gray-600'>Username</label>
                            <p className='text-lg text-gray-900 mt-1'>{userProfile.username}</p>
                        </div>
                        <div className='bg-gray-50 p-4 rounded-md'>
                            <label className='text-sm font-medium text-gray-600'>Email</label>
                            <p className='text-lg text-gray-900 mt-1'>{userProfile.email}</p>
                        </div>
                        {userProfile.createdAt && (
                            <div className='bg-gray-50 p-4 rounded-md'>
                                <label className='text-sm font-medium text-gray-600'>Member Since</label>
                                <p className='text-lg text-gray-900 mt-1'>
                                    {new Date(userProfile.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className='pt-6 border-t border-gray-200'>
                        <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center'>
                            {adminStatus && (
                                <Link
                                    to='/register'
                                    className='px-6 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors flex items-center justify-center gap-2 shadow-md'
                                >
                                    <FaUserPlus size={18} />
                                    Create Account
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className='px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-md'
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyAccount;
