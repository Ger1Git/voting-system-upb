import { useState } from 'react';
import { useRegisterMutation } from '../../context/auth';
import { MdError, MdCheckCircle } from 'react-icons/md';
import { FaRegUser } from 'react-icons/fa';
import { RiLockPasswordLine } from 'react-icons/ri';
import { MdEmail } from 'react-icons/md';
import Input from '../Input';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const registerMutation = useRegisterMutation();

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // Validate password confirmation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        try {
            await registerMutation.mutateAsync({ username, password, email });
            setSuccess(true);
            // Clear form fields after successful creation
            setUsername('');
            setPassword('');
            setConfirmPassword('');
            setEmail('');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setError(errorMessage);
        }
    };

    return (
        <div className='order-2 lg:order-1 bg-white p-7 rounded-lg shadow-xl border border-gray-200 text-gray-800 w-80 md:w-[32rem]'>
            <form onSubmit={handleRegister} className='flex flex-col justify-center'>
                <h1 className='text-3xl font-bold mb-6 text-center'>Create Account</h1>
                {error && (
                    <div className='flex items-center mb-2 bg-red-50 border border-red-200 rounded-md p-2'>
                        <MdError className='mr-2 h-5 w-5' color={'#b30404'} />
                        <span className='text-red-700'>{error}</span>
                    </div>
                )}
                {success && (
                    <div className='flex items-center mb-2 bg-green-50 border border-green-200 rounded-md p-3'>
                        <MdCheckCircle className='mr-2 h-5 w-5' color={'#10b981'} />
                        <span className='text-green-700 font-medium'>Account created successfully!</span>
                    </div>
                )}
                <Input
                    label='Full Name'
                    type='text'
                    name='username'
                    value={username}
                    placeholder='Enter full name'
                    icon={<FaRegUser />}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <Input
                    label='Email address'
                    type='email'
                    name='email'
                    value={email}
                    placeholder='Enter email address'
                    icon={<MdEmail />}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                    label='Password'
                    type='password'
                    name='password'
                    value={password}
                    placeholder='Enter password'
                    icon={<RiLockPasswordLine />}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                    label='Confirm Password'
                    type='password'
                    name='confirmPassword'
                    value={confirmPassword}
                    placeholder='Confirm your password'
                    icon={<RiLockPasswordLine />}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                    type='submit'
                    disabled={registerMutation.isPending}
                    className='bg-secondary hover:bg-secondary-light text-white font-bold py-2 px-2 rounded flex justify-center items-center my-2 transition-colors'
                >
                    {registerMutation.isPending ? 'Creating the account...' : 'Create Account'}
                </button>
            </form>
        </div>
    );
};

export default Register;
