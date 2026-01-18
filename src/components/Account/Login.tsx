import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../../context/auth';
import { MdError } from 'react-icons/md';
import { FaRegUser } from 'react-icons/fa';
import { RiLockPasswordLine } from 'react-icons/ri';
import Input from '../Input';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const loginMutation = useLoginMutation();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await loginMutation.mutateAsync({ username, password });
            navigate('/dashboard');
        } catch (error) {
            setError('Login failed. Please check your credentials.');
        }
    };

    return (
        <div className='order-2 lg:order-1 bg-white p-7 rounded-lg shadow-xl border border-gray-200 text-gray-800 w-80 md:w-[32rem]'>
            <form onSubmit={handleLogin} className='flex flex-col justify-center'>
                <h1 className='text-3xl font-bold mb-9 mt-4 text-center text-primary'>Login</h1>
                {error && (
                    <div className='flex items-center mb-2 bg-gray-100 rounded-md p-2'>
                        <MdError className='mr-2 h-8 w-8' color={'#b30404'} />
                        <span>{error}</span>
                    </div>
                )}
                <Input
                    label='Email'
                    type='email'
                    name='username'
                    value={username}
                    placeholder='Enter your email'
                    icon={<FaRegUser />}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <Input
                    label='Password'
                    type='password'
                    name='password'
                    value={password}
                    placeholder='Enter your password'
                    icon={<RiLockPasswordLine />}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    type='submit'
                    disabled={loginMutation.isPending}
                    className='bg-secondary hover:bg-accent text-white cursor-pointer font-bold py-2 px-2 rounded flex justify-center items-center mt-8 transition-colors'
                >
                    {loginMutation.isPending ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default Login;
