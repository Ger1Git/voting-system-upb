import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineMenu } from 'react-icons/ai';
import { PiSignOut } from 'react-icons/pi';
import { VscAccount } from 'react-icons/vsc';
import { FaChevronRight, FaUserPlus, FaCheck } from 'react-icons/fa';
import Cookies from 'js-cookie';
import { navItems } from '../utils/utils';
import { isAdmin } from '../utils/jwt';
import Icon from './Icon';

const Navigation = () => {
    const navItemRefs = useRef<Record<string, HTMLLIElement | null>>({});
    const profileDropdownRef = useRef<HTMLDivElement>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [underlineStyle, setUnderlineStyle] = useState({
        transform: 'translateX(0)',
        width: 0
    });
    const location = useLocation();
    const navigate = useNavigate();

    const isAuthenticated = Boolean(Cookies.get('token'));
    const [adminStatus, setAdminStatus] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            const admin = isAdmin();
            console.log('Navigation - Admin status:', admin);
            setAdminStatus(admin);
        } else {
            setAdminStatus(false);
        }
    }, [isAuthenticated, location.pathname]);

    const toggleMobileMenu = () => {
        setIsMenuOpen((prev) => !prev);
    };

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen((prev) => !prev);
    };

    const handleLogout = () => {
        setIsMenuOpen(false);
        setIsProfileDropdownOpen(false);
        Cookies.remove('token');
        navigate('/login');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        };

        if (isProfileDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileDropdownOpen]);

    useEffect(() => {
        const activeEl = navItemRefs.current[location.pathname];
        if (!activeEl) return;

        setUnderlineStyle({
            transform: `translateX(${activeEl.offsetLeft}px)`,
            width: activeEl.offsetWidth
        });
    }, [location.pathname]);

    if (!isAuthenticated) return null;

    return (
        <header className="sticky top-0 z-10 w-full bg-primary shadow-lg">
            <div className="flex h-21 items-center justify-between px-4 text-white">
                <div
                    className="flex cursor-pointer items-center gap-3 py-1.25"
                    onClick={() => navigate('/')}
                >
                    <Icon
                        name="logo"
                        className="h-16 w-12 text-white lg:h-20 lg:w-16"
                    />
                    <span className="font-serif text-lg lg:text-xl">
                        AI Travel Planner
                    </span>
                </div>

                <div className="hidden items-center lg:flex">
                    <nav className="relative">
                        <ul className="flex font-serif">
                            {navItems.map(({ id, link, label }) => (
                                <li
                                    key={id}
                                    ref={(el) => {
                                        navItemRefs.current[link] = el;
                                    }}
                                    className="px-4 mx-4 py-2 text-xl cursor-pointer"
                                >
                                    <Link
                                        to={link}
                                        className="hover:text-gray-300"
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                            {adminStatus && (
                                <li
                                    ref={(el) => {
                                        navItemRefs.current['/trips/review'] = el;
                                    }}
                                    className="px-4 mx-4 py-2 text-xl cursor-pointer"
                                >
                                    <Link
                                        to="/trips/review"
                                        className="hover:text-gray-300"
                                    >
                                        Review Trips
                                    </Link>
                                </li>
                            )}
                        </ul>

                        <span
                            className="custom-underline"
                            style={underlineStyle}
                        />
                    </nav>

                    <div className="ml-6 flex gap-4 items-center">
                        <div className="relative" ref={profileDropdownRef}>
                            <VscAccount
                                size={30}
                                className="cursor-pointer hover:scale-110 transition-transform"
                                onClick={toggleProfileDropdown}
                            />
                            {isProfileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                    <Link
                                        to="/account"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        onClick={() => setIsProfileDropdownOpen(false)}
                                    >
                                        <VscAccount size={18} />
                                        My Account
                                    </Link>
                                    {adminStatus && (
                                        <Link
                                            to="/register"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                        >
                                            <FaUserPlus size={18} />
                                            Create Account
                                        </Link>
                                    )}
                                    <div className="border-t border-gray-200 my-1"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <PiSignOut size={18} />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <button
                    className="block lg:hidden"
                    onClick={toggleMobileMenu}
                >
                    <AiOutlineMenu size={20} />
                </button>
            </div>

            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
                    onClick={toggleMobileMenu}
                />
            )}

            <aside
                className={`fixed top-0 right-0 z-30 h-full w-1/2 max-w-xs
                    bg-white
                    shadow-2xl
                    transition-transform duration-500 ease-in-out
                    lg:hidden
                    ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                <ul className="mt-6">
                    {navItems.map(({ id, link, label }) => (
                        <li key={id} className="m-4 p-2">
                            <Link
                                to={link}
                                className="flex items-center justify-between text-black hover:text-gray-300"
                                onClick={toggleMobileMenu}
                            >
                                {label}
                                <FaChevronRight />
                            </Link>
                        </li>
                    ))}
                    {adminStatus && (
                        <li className="m-4 p-2">
                            <Link
                                to="/trips/review"
                                className="flex items-center justify-between text-black hover:text-gray-300"
                                onClick={toggleMobileMenu}
                            >
                                Review Trips
                                <FaChevronRight />
                            </Link>
                        </li>
                    )}
                </ul>

                <div className="m-4 p-2">
                    <Link
                        to="/account"
                        className="mb-3 flex items-center text-gray-800 hover:text-primary"
                        onClick={toggleMobileMenu}
                    >
                        <VscAccount size={24} />
                        <span className="pl-4">Account</span>
                    </Link>

                    <button
                        className="flex items-center text-gray-800 hover:text-red-500"
                        onClick={handleLogout}
                    >
                        <PiSignOut size={24} />
                        <span className="pl-4">Sign out</span>
                    </button>
                </div>
            </aside>
        </header>
    );
};

export default Navigation;
