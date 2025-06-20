"use client"

import { User, Moon, Sun, Menu, X, CircleX, UserCircle, ChevronDown } from 'lucide-react';
import creditoyaLogo from "@/assets/logos/creditoya_logo_minimalist.png"
import Image from 'next/image';
import { useDarkMode } from '@/context/DarkModeContext';
import { useClientAuth } from '@/context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

function NavBar() {
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();
    const userMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    const { changeDarkMode, darkmode } = useDarkMode();
    const { user, isAuthenticated, logout } = useClientAuth();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    setScrolled(window.scrollY > 10);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    const isValidAvatar = (avatarUrl: string | undefined | null): boolean => {
        return Boolean(avatarUrl && avatarUrl !== "No definido" && avatarUrl.trim() !== "");
    };

    const handleNavigation = (path: string) => {
        router.push(path);
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
    };

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
    };

    const UserAvatar = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
        isValidAvatar(user?.avatar) ? (
            <Image
                src={user?.avatar as string}
                alt="Avatar del usuario"
                width={size}
                height={size}
                className={`object-cover rounded-full border-2 border-green-400 dark:border-green-500 transition-all duration-200 ${className}`}
                style={{ width: size, height: size }}
                priority={true}
            />
        ) : (
            <div
                className={`rounded-full border-2 border-green-400 dark:border-green-500 flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 transition-all duration-200 ${className}`}
                style={{ width: size, height: size }}
            >
                <UserCircle size={size * 0.7} className="text-green-500 dark:text-green-400" />
            </div>
        )
    );

    const ThemeToggleButton = () => {
        if (!isMounted) {
            return (
                <button
                    onClick={changeDarkMode}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400/50 dark:focus:ring-green-500/50 focus:ring-offset-transparent drop-shadow-sm"
                    aria-label="Cambiar tema"
                >
                    <div className="w-[18px] h-[18px]" />
                </button>
            );
        }

        return (
            <button
                onClick={changeDarkMode}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400/50 dark:focus:ring-green-500/50 focus:ring-offset-transparent drop-shadow-sm"
                aria-label="Cambiar tema"
            >
                {darkmode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
        );
    };

    const MobileThemeSection = () => {
        if (!isMounted) {
            return (
                <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-gray-100 dark:bg-gray-800">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100 drop-shadow-sm">
                        Cambiar tema
                    </span>
                    <button
                        onClick={changeDarkMode}
                        className="p-2 rounded-md text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                        aria-label="Cambiar tema"
                    >
                        <div className="w-[18px] h-[18px]" />
                    </button>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-gray-100 dark:bg-gray-800">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100 drop-shadow-sm">
                    {darkmode ? 'Tema oscuro' : 'Tema claro'}
                </span>
                <button
                    onClick={changeDarkMode}
                    className="p-2 rounded-md text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                    aria-label="Cambiar tema"
                >
                    {darkmode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>
        );
    };

    return (
        <>
            {/* Backdrop overlay for mobile menu */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            <header
                className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ease-out ${scrolled
                    ? 'backdrop-blur-xl bg-gray-50/95 dark:bg-gray-900/95 shadow-lg border-b border-gray-200 dark:border-gray-700'
                    : 'backdrop-blur-md bg-gray-50/90 dark:bg-gray-900/90'
                    }`}
                role="banner"
            >
                <nav
                    className="py-3 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
                    role="navigation"
                    aria-label="Navegación principal"
                >
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center flex-shrink-0">
                            <button
                                onClick={() => handleNavigation("/")}
                                className="focus:outline-none focus:ring-2 focus:ring-green-400/50 dark:focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-transparent rounded-md transition-all duration-200 hover:scale-105"
                                aria-label="Ir a la página principal"
                            >
                                <Image
                                    priority={true}
                                    src={creditoyaLogo.src}
                                    alt="Logo de Creditoya"
                                    width={150}
                                    height={80}
                                    className="h-10 w-auto sm:h-12 drop-shadow-lg dark:brightness-0 dark:invert transition-all duration-200"
                                />
                            </button>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
                            {isAuthenticated ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center space-x-3 py-2 px-3 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 backdrop-blur-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400/50 dark:focus:ring-green-500/50 focus:ring-offset-transparent"
                                        aria-expanded={isUserMenuOpen}
                                        aria-haspopup="true"
                                    >
                                        <UserAvatar size={32} />
                                        <div className="flex flex-col items-start min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 drop-shadow-sm truncate max-w-[120px]">
                                                {user?.names} {user?.firstLastName}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 drop-shadow-sm">
                                                Mi cuenta
                                            </p>
                                        </div>
                                        <ChevronDown
                                            size={16}
                                            className={`text-gray-600 dark:text-gray-300 drop-shadow-sm transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </button>

                                    {/* User dropdown menu */}
                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-gray-50/98 dark:bg-gray-900/98 backdrop-blur-xl rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-10">
                                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center space-x-3">
                                                    <UserAvatar size={40} />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                                                            {user?.names} {user?.firstLastName}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                                            {user?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleNavigation("/panel/perfil")}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
                                            >
                                                Ver perfil
                                            </button>

                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 flex items-center space-x-2"
                                            >
                                                <CircleX size={16} />
                                                <span>Cerrar sesión</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleNavigation("/auth")}
                                    className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 backdrop-blur-sm border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-gray-800 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400/50 dark:focus:ring-green-500/50 focus:ring-offset-transparent font-medium drop-shadow-sm"
                                >
                                    <User size={16} />
                                    <span>Iniciar sesión</span>
                                </button>
                            )}

                            {/* Theme toggle */}
                            <ThemeToggleButton />
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-lg text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 backdrop-blur-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400/50 dark:focus:ring-green-500/50 focus:ring-offset-transparent drop-shadow-sm"
                            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
                            aria-expanded={isMenuOpen}
                        >
                            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </nav>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div
                        ref={mobileMenuRef}
                        className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-xl"
                        role="menu"
                    >
                        <div className="max-w-6xl mx-auto py-4 px-4 space-y-4">
                            {/* User section */}
                            {isAuthenticated ? (
                                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <UserAvatar size={48} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-base font-semibold text-gray-800 dark:text-gray-100 drop-shadow-sm truncate">
                                                {user?.names} {user?.firstLastName}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 drop-shadow-sm truncate">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleNavigation("/panel/perfil")}
                                        className="w-full text-left py-3 px-4 rounded-lg text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
                                        role="menuitem"
                                    >
                                        Ver perfil completo
                                    </button>
                                </div>
                            ) : (
                                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => handleNavigation("/auth")}
                                        className="flex items-center justify-center space-x-2 w-full py-3 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 transition-all duration-200 font-medium"
                                        role="menuitem"
                                    >
                                        <User size={18} />
                                        <span>Iniciar sesión</span>
                                    </button>
                                </div>
                            )}

                            {/* Theme toggle */}
                            <MobileThemeSection />

                            {/* Logout button */}
                            {isAuthenticated && (
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center justify-center space-x-2 w-full py-3 px-4 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 backdrop-blur-sm border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 transition-all duration-200 font-medium"
                                    role="menuitem"
                                >
                                    <CircleX size={18} />
                                    <span>Cerrar sesión</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </header>
        </>
    );
}

export default NavBar;