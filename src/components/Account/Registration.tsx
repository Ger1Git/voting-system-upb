import { useState } from 'react';
import { useRegisterMutation } from '../../context/auth';
import { MdError, MdCheckCircle, MdQrCodeScanner, MdPhone, MdLocationOn } from 'react-icons/md';
import { FaRegUser, FaIdCard } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import Input from '../Input';
import QRScanner from '../QRScanner';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const registerMutation = useRegisterMutation();

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // Validate required fields
        if (!username || !email) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            await registerMutation.mutateAsync({ 
                username, 
                email,
                phone,
                address,
                idNumber
            });
            setSuccess(true);
            // Clear form fields after successful creation
            setUsername('');
            setEmail('');
            setPhone('');
            setAddress('');
            setIdNumber('');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setError(errorMessage);
        }
    };

    const handleQRScan = (decodedText: string) => {
        try {
            // Parse the QR code data (assuming it's JSON with registration info)
            const data = JSON.parse(decodedText);
            
            if (data.username) setUsername(data.username);
            if (data.email) setEmail(data.email);
            if (data.phone) setPhone(data.phone);
            if (data.address) setAddress(data.address);
            if (data.idNumber) setIdNumber(data.idNumber);
            
            setShowQRScanner(false);
            setSuccess(false);
            setError('');
        } catch (err) {
            setError('Invalid QR code format. Please scan a valid registration QR code.');
            setShowQRScanner(false);
        }
    };

    return (
        <div className='order-2 lg:order-1 bg-white p-7 rounded-lg shadow-xl border border-gray-200 text-gray-800 w-80 md:w-[32rem]'>
            {showQRScanner && (
                <QRScanner
                    onScanSuccess={handleQRScan}
                    onClose={() => setShowQRScanner(false)}
                />
            )}
            <form onSubmit={handleRegister} className='flex flex-col justify-center'>
                <h1 className='text-3xl font-bold mb-6 text-center'>Create Account</h1>
                
                <button
                    type='button'
                    onClick={() => setShowQRScanner(true)}
                    className='bg-black hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded flex justify-center items-center mb-4 transition-colors'
                >
                    <MdQrCodeScanner className='mr-2 h-5 w-5' />
                    Scan QR Code to Fill Form
                </button>
                
                {error && (
                    <div className='flex items-center mb-2 bg-red-50 border border-red-200 rounded-md p-2'>
                        <MdError className='mr-2 h-5 w-5' color={'#b30404'} />
                        <span className='text-red-700'>{error}</span>
                    </div>
                )}
                {success && (
                    <div className='flex items-center mb-2 bg-green-50 border border-green-200 rounded-md p-3'>
                        <MdCheckCircle className='mr-2 h-5 w-5' color={'#10b981'} />
                        <span className='text-green-700 font-medium'>Account created successfully! Password has been sent to your email.</span>
                    </div>
                )}
                
                <div className='mb-4'>
                    <h2 className='text-lg font-semibold text-gray-700 mb-3 border-b pb-2'>User Information</h2>
                    
                    <Input
                        label='Full Name *'
                        type='text'
                        name='username'
                        value={username}
                        placeholder='Enter full name'
                        icon={<FaRegUser />}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <Input
                        label='ID Number'
                        type='text'
                        name='idNumber'
                        value={idNumber}
                        placeholder='Enter ID number'
                        icon={<FaIdCard />}
                        onChange={(e) => setIdNumber(e.target.value)}
                    />
                    <Input
                        label='Phone Number'
                        type='tel'
                        name='phone'
                        value={phone}
                        placeholder='Enter phone number'
                        icon={<MdPhone />}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    <Input
                        label='Address'
                        type='text'
                        name='address'
                        value={address}
                        placeholder='Enter address'
                        icon={<MdLocationOn />}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </div>
                
                <div className='mb-4'>
                    <h2 className='text-lg font-semibold text-gray-700 mb-3 border-b pb-2'>Account Credentials</h2>
                    
                    <Input
                        label='Email Address *'
                        type='email'
                        name='email'
                        value={email}
                        placeholder='Enter email address'
                        icon={<MdEmail />}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <p className='text-sm text-gray-600 mt-2 bg-blue-50 p-3 rounded-md border border-blue-200'>
                        Your account password will be automatically generated and sent to your email address.
                    </p>
                </div>
                <button
                    type='submit'
                    disabled={registerMutation.isPending}
                    className='bg-black hover:bg-gray-700 text-white font-bold py-2 px-2 rounded flex justify-center items-center my-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
                >
                    {registerMutation.isPending ? 'Creating the account...' : 'Create Account'}
                </button>
            </form>
        </div>
    );
};

export default Register;
